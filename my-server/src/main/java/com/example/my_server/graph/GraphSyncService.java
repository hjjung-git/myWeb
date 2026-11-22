package com.example.my_server.graph;

import com.example.my_server.ai.ChunkSyncService;
import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.domain.CodeSnippetVariant;
import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.Post;
import com.example.my_server.domain.SkillLevel;
import com.example.my_server.repository.CodeSnippetRepository;
import com.example.my_server.repository.PortfolioItemRepository;
import com.example.my_server.repository.PostRepository;
import com.example.my_server.repository.SkillLevelRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * MySQL(원본) → Neo4j(파생 그래프) 동기화. 그래프는 언제든 MySQL에서 다시 만들 수 있다(resyncAll).
 *
 * 노드: Note(Archive 글) · Code(Codebase 글) · Project(포트폴리오 프로젝트·경력) · Skill(기술, 언어 포함) · Category(Notes 분류) · Purpose(Codebase 용도)
 * 관계: (Note)-[:IN_CATEGORY]->(Category)-[:SUBCATEGORY_OF]->(Category)
 *       (Note|Code)-[:ABOUT]->(Skill)          ← 글에서 고른 '관련 기술'
 *       (Note|Code)-[:RELATED_TO]->(Project)   ← 글에서 고른 '관련 프로젝트'
 *       (Code)-[:WRITTEN_IN]->(Skill)          ← 코드 언어 칸(Python, Java …)
 *       (Code)-[:FOR]->(Purpose)               ← 용도(재사용 알고리즘 …)
 *       (Project)-[:USES]->(Skill)             ← 프로젝트 기술 스택
 * Skill에는 '내 숙련도'(level·featured)도 붙는다.
 * 글·코드는 검색용 조각(Chunk, 임베딩 벡터 포함)으로도 나뉘어 (Chunk)-[:PART_OF]->(Note|Code)로 붙는다(ChunkSyncService).
 * '전체 다시 맞추기'는 Chunk를 지우지 않는다 — 내용이 그대로인 조각은 다시 임베딩하지 않기 위해서.
 */
@Service
public class GraphSyncService
{
    static final List<String> SCHEMA = List.of(
            "CREATE CONSTRAINT note_id IF NOT EXISTS FOR (n:Note) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT code_id IF NOT EXISTS FOR (n:Code) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT project_id IF NOT EXISTS FOR (n:Project) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT skill_key IF NOT EXISTS FOR (n:Skill) REQUIRE n.key IS UNIQUE",
            "CREATE CONSTRAINT category_path IF NOT EXISTS FOR (n:Category) REQUIRE n.path IS UNIQUE",
            "CREATE CONSTRAINT purpose_name IF NOT EXISTS FOR (n:Purpose) REQUIRE n.name IS UNIQUE");

    static final String NOTE_UPSERT = """
            MERGE (n:Note {id: $id})
            SET n.title = $title, n.category = $category, n.subcategory = $subcategory,
                n.minorCategory = $minorCategory, n.updatedAt = $updatedAt
            WITH n
            OPTIONAL MATCH (n)-[r:IN_CATEGORY|ABOUT|RELATED_TO]->()
            DELETE r
            WITH DISTINCT n
            FOREACH (c IN $categories | MERGE (cat:Category {path: c.path}) SET cat.name = c.name, cat.level = c.level)
            FOREACH (l IN $categoryLinks | MERGE (child:Category {path: l.child}) MERGE (parent:Category {path: l.parent})
                MERGE (child)-[:SUBCATEGORY_OF]->(parent))
            FOREACH (p IN $leaf | MERGE (cat:Category {path: p}) MERGE (n)-[:IN_CATEGORY]->(cat))
            FOREACH (s IN $skills | MERGE (k:Skill {key: s.key}) ON CREATE SET k.name = s.name MERGE (n)-[:ABOUT]->(k))
            FOREACH (pid IN $projectIds | MERGE (p:Project {id: pid}) MERGE (n)-[:RELATED_TO]->(p))
            """;

    static final String CODE_UPSERT = """
            MERGE (n:Code {id: $id})
            SET n.title = $title, n.description = $description, n.purpose = $purpose,
                n.languages = $languages, n.updatedAt = $updatedAt
            WITH n
            OPTIONAL MATCH (n)-[r:WRITTEN_IN|FOR|ABOUT|RELATED_TO]->()
            DELETE r
            WITH DISTINCT n
            FOREACH (s IN $languageSkills | MERGE (k:Skill {key: s.key}) ON CREATE SET k.name = s.name
                MERGE (n)-[:WRITTEN_IN]->(k))
            FOREACH (u IN $purposes | MERGE (p:Purpose {name: u}) MERGE (n)-[:FOR]->(p))
            FOREACH (s IN $skills | MERGE (k:Skill {key: s.key}) ON CREATE SET k.name = s.name MERGE (n)-[:ABOUT]->(k))
            FOREACH (pid IN $projectIds | MERGE (p:Project {id: pid}) MERGE (n)-[:RELATED_TO]->(p))
            """;

    static final String PROJECT_UPSERT = """
            MERGE (p:Project {id: $id})
            SET p.title = $title, p.kind = $kind, p.period = $period, p.summary = $summary
            WITH p
            OPTIONAL MATCH (p)-[r:USES]->()
            DELETE r
            WITH DISTINCT p
            FOREACH (s IN $skills | MERGE (k:Skill {key: s.key}) ON CREATE SET k.name = s.name MERGE (p)-[:USES]->(k))
            """;

    static final String SKILLS_UPSERT = """
            UNWIND $levels AS s
            MERGE (k:Skill {key: s.key})
            SET k.name = s.name, k.level = s.level, k.featured = s.featured, k.listed = true
            """;
    static final String SKILLS_UNLIST = """
            MATCH (k:Skill) WHERE k.listed = true AND NOT k.key IN $keys
            SET k.listed = false REMOVE k.level, k.featured
            """;

    static final String DELETE_NOTE = "MATCH (n:Note {id: $id}) DETACH DELETE n";
    static final String DELETE_CODE = "MATCH (n:Code {id: $id}) DETACH DELETE n";
    static final String DELETE_PROJECT = "MATCH (n:Project {id: $id}) DETACH DELETE n";

    // 아무 데도 이어지지 않은 분류·용도·기술을 지운다(분류는 최대 3단계라 세 번 돌리면 위까지 정리된다).
    static final String CLEANUP_CATEGORIES =
            "MATCH (c:Category) WHERE NOT EXISTS { (c)<-[:IN_CATEGORY|SUBCATEGORY_OF]-() } DETACH DELETE c";
    static final String CLEANUP_PURPOSES = "MATCH (u:Purpose) WHERE NOT EXISTS { (u)<-[:FOR]-() } DELETE u";
    static final String CLEANUP_SKILLS =
            "MATCH (k:Skill) WHERE NOT EXISTS { (k)--() } AND coalesce(k.listed, false) = false DELETE k";

    static final String WIPE =
            "MATCH (n) WHERE n:Note OR n:Code OR n:Project OR n:Skill OR n:Category OR n:Purpose DETACH DELETE n";
    static final String COUNT_NODES = "MATCH (n) RETURN labels(n)[0] AS name, count(*) AS count ORDER BY name";
    static final String COUNT_RELS = "MATCH ()-[r]->() RETURN type(r) AS name, count(*) AS count ORDER BY name";
    static final String COUNT_EMBEDDED = "MATCH (c:Chunk) RETURN count(c) AS chunks, count(c.embedding) AS embedded";

    private final Neo4jHttpClient neo4j;
    private final PostRepository postRepository;
    private final CodeSnippetRepository codeSnippetRepository;
    private final PortfolioItemRepository portfolioItemRepository;
    private final SkillLevelRepository skillLevelRepository;
    private final ChunkSyncService chunks;

    public GraphSyncService(Neo4jHttpClient neo4j, PostRepository postRepository,
                            CodeSnippetRepository codeSnippetRepository,
                            PortfolioItemRepository portfolioItemRepository,
                            SkillLevelRepository skillLevelRepository,
                            ChunkSyncService chunks)
    {
        this.chunks = chunks;
        this.neo4j = neo4j;
        this.postRepository = postRepository;
        this.codeSnippetRepository = codeSnippetRepository;
        this.portfolioItemRepository = portfolioItemRepository;
        this.skillLevelRepository = skillLevelRepository;
    }

    public boolean isEnabled() { return neo4j.isEnabled(); }

    public void ensureSchema()
    {
        SCHEMA.forEach(neo4j::run);
        chunks.schema().forEach(neo4j::run);
    }

    // ---- 한 건씩 반영: MySQL에 있으면 갱신, 없으면(삭제됨) 그래프에서도 지운다 ----

    @Transactional(readOnly = true)
    public void syncNote(Long id)
    {
        postRepository.findById(id).ifPresentOrElse(
                post -> {
                    neo4j.run(NOTE_UPSERT, noteParams(post, existingProjectIds()));
                    chunks.syncNote(post);
                },
                () -> {
                    neo4j.run(DELETE_NOTE, Map.of("id", id));
                    chunks.deleteNote(id);
                });
        cleanup();
    }

    @Transactional(readOnly = true)
    public void syncCode(Long id)
    {
        codeSnippetRepository.findById(id).ifPresentOrElse(
                code -> {
                    neo4j.run(CODE_UPSERT, codeParams(code, existingProjectIds()));
                    chunks.syncCode(code);
                },
                () -> {
                    neo4j.run(DELETE_CODE, Map.of("id", id));
                    chunks.deleteCode(id);
                });
        cleanup();
    }

    @Transactional(readOnly = true)
    public void syncProject(Long id)
    {
        portfolioItemRepository.findById(id).ifPresentOrElse(
                item -> neo4j.run(PROJECT_UPSERT, projectParams(item)),
                () -> neo4j.run(DELETE_PROJECT, Map.of("id", id)));
        cleanup();
    }

    @Transactional(readOnly = true)
    public void syncSkills()
    {
        List<Map<String, Object>> levels = new ArrayList<>();
        List<String> keys = new ArrayList<>();
        for (SkillLevel s : skillLevelRepository.findAll()) {
            String key = GraphMapping.skillKey(s.getName());
            if (key == null || keys.contains(key)) continue;
            keys.add(key);
            levels.add(Map.of("key", key, "name", s.getName(), "level", s.getLevel(), "featured", s.isFeatured()));
        }
        neo4j.run(SKILLS_UPSERT, Map.of("levels", levels));
        neo4j.run(SKILLS_UNLIST, Map.of("keys", keys));
        neo4j.run(CLEANUP_SKILLS);
    }

    // ---- 전체 다시 맞추기: 그래프를 비우고 MySQL에서 처음부터 다시 만든다 ----

    @Transactional(readOnly = true)
    public Map<String, Object> resyncAll()
    {
        long started = System.currentTimeMillis();
        neo4j.run(WIPE);
        ensureSchema();
        syncSkills();

        List<PortfolioItem> items = portfolioItemRepository.findAll();
        items.forEach(item -> neo4j.run(PROJECT_UPSERT, projectParams(item)));
        Set<Long> projectIds = items.stream().map(PortfolioItem::getId).collect(Collectors.toSet());

        List<Post> posts = postRepository.findAll();
        posts.forEach(post -> neo4j.run(NOTE_UPSERT, noteParams(post, projectIds)));

        List<CodeSnippet> codes = codeSnippetRepository.findAll(Sort.by("id"));
        codes.forEach(code -> neo4j.run(CODE_UPSERT, codeParams(code, projectIds)));
        cleanup();

        // 검색 조각: 내용이 바뀐 조각만 다시 임베딩, 지워진 글·코드의 조각은 정리
        posts.forEach(chunks::syncNote);
        codes.forEach(chunks::syncCode);
        chunks.deleteOrphans();

        Map<String, Object> result = new LinkedHashMap<>(status());
        result.put("synced", Map.of("notes", posts.size(), "codes", codes.size(), "projects", items.size()));
        result.put("tookMs", System.currentTimeMillis() - started);
        return result;
    }

    /** 그래프 상태 — 라벨별 노드 수, 관계 종류별 수. 연결이 안 되면 ok=false와 이유. */
    public Map<String, Object> status()
    {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", isEnabled());
        if (!isEnabled()) {
            out.put("ok", false);
            out.put("error", "그래프 동기화가 꺼져 있습니다(GRAPH_ENABLED=true 필요).");
            return out;
        }
        try {
            out.put("nodes", counts(neo4j.run(COUNT_NODES)));
            out.put("relationships", counts(neo4j.run(COUNT_RELS)));
            neo4j.run(COUNT_EMBEDDED).stream().findFirst().ifPresent(r -> {
                out.put("chunks", r.get("chunks"));
                out.put("embedded", r.get("embedded"));
            });
            out.put("ok", true);
        } catch (GraphException e) {
            out.put("ok", false);
            out.put("error", e.getMessage());
        }
        return out;
    }

    private void cleanup()
    {
        for (int i = 0; i < 3; i++) neo4j.run(CLEANUP_CATEGORIES);
        neo4j.run(CLEANUP_PURPOSES);
        neo4j.run(CLEANUP_SKILLS);
    }

    private Set<Long> existingProjectIds()
    {
        return portfolioItemRepository.findAll().stream().map(PortfolioItem::getId).collect(Collectors.toSet());
    }

    private static Map<String, Object> counts(List<Map<String, Object>> rows)
    {
        Map<String, Object> out = new LinkedHashMap<>();
        rows.forEach(r -> out.put(String.valueOf(r.get("name")), r.get("count")));
        return out;
    }

    // ---- MySQL 엔티티 → Cypher 파라미터 ----

    static Map<String, Object> noteParams(Post post, Set<Long> projectIds)
    {
        List<String> names = GraphMapping.categoryNames(post.getCategory(), post.getSubcategory(), post.getMinorCategory());
        Map<String, Object> p = new HashMap<>();
        p.put("id", post.getId());
        p.put("title", post.getTitle());
        p.put("category", post.getCategory());
        p.put("subcategory", post.getSubcategory());
        p.put("minorCategory", post.getMinorCategory());
        p.put("updatedAt", text(post.getLastModifiedAt()));
        p.put("categories", GraphMapping.categoryNodes(names));
        p.put("categoryLinks", GraphMapping.categoryLinks(names));
        p.put("leaf", GraphMapping.leafPath(names));
        p.put("skills", GraphMapping.skills(post.getRelatedSkills()));
        p.put("projectIds", GraphMapping.ids(post.getRelatedProjectIds()).stream().filter(projectIds::contains).toList());
        return p;
    }

    static Map<String, Object> codeParams(CodeSnippet code, Set<Long> projectIds)
    {
        List<String> languages = code.getVariants().stream().map(CodeSnippetVariant::getLanguage).distinct().toList();
        Map<String, Object> p = new HashMap<>();
        p.put("id", code.getId());
        p.put("title", code.getTitle());
        p.put("description", code.getDescription());
        p.put("purpose", code.getCategory());
        p.put("languages", languages);
        p.put("updatedAt", text(code.getLastModifiedAt()));
        p.put("languageSkills", GraphMapping.skills(String.join(",", languages)));
        p.put("purposes", GraphMapping.blank(code.getCategory()) ? List.of() : List.of(code.getCategory().trim()));
        p.put("skills", GraphMapping.skills(code.getRelatedSkills()));
        p.put("projectIds", GraphMapping.ids(code.getRelatedProjectIds()).stream().filter(projectIds::contains).toList());
        return p;
    }

    static Map<String, Object> projectParams(PortfolioItem item)
    {
        Map<String, Object> p = new HashMap<>();
        p.put("id", item.getId());
        p.put("title", item.getTitle());
        p.put("kind", item.getType() == null ? null : item.getType().name());
        p.put("period", item.getPeriodText());
        p.put("summary", item.getSummary());
        p.put("skills", GraphMapping.skills(item.getTechStack()));
        return p;
    }

    private static String text(ZonedDateTime time) { return time == null ? null : time.toOffsetDateTime().toString(); }
}
