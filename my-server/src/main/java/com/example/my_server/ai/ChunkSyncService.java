package com.example.my_server.ai;

import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.domain.CodeSnippetVariant;
import com.example.my_server.domain.Post;
import com.example.my_server.graph.Neo4jHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 글·코드 → 조각(Chunk) 노드 + 임베딩 벡터. (Chunk)-[:PART_OF]->(Note|Code)
 * - 조각 내용(+모델 이름)의 해시가 같으면 다시 임베딩하지 않는다 → 같은 글을 여러 번 저장해도 Voyage 비용이 안 늘어난다.
 * - Voyage 키가 없으면 조각만 만들고(키워드 검색용) 벡터는 비워 둔다.
 */
@Service
public class ChunkSyncService
{
    private static final Logger log = LoggerFactory.getLogger(ChunkSyncService.class);
    static final int CODE_MAX_CHARS = 3000;

    public static final String VECTOR_INDEX = "chunk_embedding";
    public static final String FULLTEXT_INDEX = "chunk_text";

    // 벡터가 없는 조각은 해시를 없는 것으로 본다 → 나중에 키를 넣으면 그때 임베딩된다
    static final String EXISTING = "MATCH (c:Chunk {docKey: $docKey}) "
            + "RETURN c.id AS id, CASE WHEN c.embedding IS NULL THEN null ELSE c.hash END AS hash";
    static final String UPSERT = """
            UNWIND $chunks AS ch
            MERGE (c:Chunk {id: ch.id})
            SET c.docKey = $docKey, c.docType = $docType, c.docId = $docId, c.idx = ch.idx,
                c.title = ch.title, c.text = ch.text, c.hash = ch.hash,
                c.embedding = CASE WHEN ch.embedding IS NULL THEN c.embedding ELSE ch.embedding END
            WITH c
            MATCH (d:%s {id: $docId})
            MERGE (c)-[:PART_OF]->(d)
            """;
    static final String DELETE_STALE = "MATCH (c:Chunk {docKey: $docKey}) WHERE NOT c.id IN $ids DETACH DELETE c";
    static final String DELETE_DOC = "MATCH (c:Chunk {docKey: $docKey}) DETACH DELETE c";
    static final String DELETE_ORPHANS = "MATCH (c:Chunk) WHERE NOT EXISTS { (c)-[:PART_OF]->() } DETACH DELETE c";

    private final Neo4jHttpClient neo4j;
    private final VoyageClient voyage;
    private final AiSettings settings;

    public ChunkSyncService(Neo4jHttpClient neo4j, VoyageClient voyage, AiSettings settings)
    {
        this.neo4j = neo4j;
        this.voyage = voyage;
        this.settings = settings;
    }

    /** 조각 검색에 필요한 인덱스 — 벡터 인덱스는 임베딩을 쓸 때만 만든다. */
    public List<String> schema()
    {
        List<String> s = new ArrayList<>();
        s.add("CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE");
        s.add("CREATE INDEX chunk_doc IF NOT EXISTS FOR (c:Chunk) ON (c.docKey)");
        s.add("CREATE FULLTEXT INDEX " + FULLTEXT_INDEX + " IF NOT EXISTS FOR (c:Chunk) ON EACH [c.title, c.text] "
                + "OPTIONS {indexConfig: {`fulltext.analyzer`: 'cjk'}}");
        if (settings.embeddingEnabled()) {
            s.add("CREATE VECTOR INDEX " + VECTOR_INDEX + " IF NOT EXISTS FOR (c:Chunk) ON c.embedding "
                    + "OPTIONS {indexConfig: {`vector.dimensions`: " + settings.embeddingDimensions()
                    + ", `vector.similarity_function`: 'cosine'}}");
        }
        return s;
    }

    // ---- 문서 → 조각 ----

    record Piece(String id, int idx, String title, String text, String embedInput) {}

    static List<Piece> notePieces(Post post)
    {
        String path = String.join(" › ", nonBlank(post.getCategory(), post.getSubcategory(), post.getMinorCategory()));
        List<String> parts = TextChunker.chunk(post.getContent());
        List<Piece> pieces = new ArrayList<>();
        for (int i = 0; i < parts.size(); i++) {
            String head = "제목: " + post.getTitle() + (path.isEmpty() ? "" : "\n분류: " + path);
            pieces.add(new Piece("note-" + post.getId() + "-" + i, i, post.getTitle(), parts.get(i), head + "\n\n" + parts.get(i)));
        }
        return pieces;
    }

    static List<Piece> codePieces(CodeSnippet code)
    {
        List<Piece> pieces = new ArrayList<>();
        int i = 0;
        for (CodeSnippetVariant v : code.getVariants()) {
            String content = v.getContent() == null ? "" : v.getContent();
            if (content.length() > CODE_MAX_CHARS) content = content.substring(0, CODE_MAX_CHARS);
            StringBuilder text = new StringBuilder();
            if (code.getDescription() != null && !code.getDescription().isBlank()) text.append(code.getDescription()).append("\n\n");
            text.append("[").append(v.getLanguage()).append("]\n").append(content);
            String head = "제목: " + code.getTitle()
                    + (code.getCategory() == null ? "" : "\n용도: " + code.getCategory())
                    + "\n언어: " + v.getLanguage();
            pieces.add(new Piece("code-" + code.getId() + "-" + i, i, code.getTitle(), text.toString(), head + "\n\n" + text));
            i++;
        }
        return pieces;
    }

    // ---- 동기화 ----

    public void syncNote(Post post) { sync("note-" + post.getId(), "note", post.getId(), "Note", notePieces(post)); }

    public void syncCode(CodeSnippet code) { sync("code-" + code.getId(), "code", code.getId(), "Code", codePieces(code)); }

    public void deleteNote(Long id) { neo4j.run(DELETE_DOC, Map.of("docKey", "note-" + id)); }

    public void deleteCode(Long id) { neo4j.run(DELETE_DOC, Map.of("docKey", "code-" + id)); }

    public void deleteOrphans() { neo4j.run(DELETE_ORPHANS); }

    private void sync(String docKey, String docType, Long docId, String label, List<Piece> pieces)
    {
        Map<String, String> existing = new HashMap<>();
        for (Map<String, Object> row : neo4j.run(EXISTING, Map.of("docKey", docKey))) {
            existing.put(String.valueOf(row.get("id")), (String) row.get("hash"));
        }

        // 바뀐 조각만 임베딩한다(해시 = 모델 + 임베딩 입력)
        List<Map<String, Object>> rows = new ArrayList<>();
        List<Integer> toEmbed = new ArrayList<>();
        for (int i = 0; i < pieces.size(); i++) {
            Piece p = pieces.get(i);
            String hash = TextChunker.sha256(settings.embeddingModel() + "\n" + p.embedInput());
            Map<String, Object> row = new HashMap<>();
            row.put("id", p.id());
            row.put("idx", p.idx());
            row.put("title", p.title());
            row.put("text", p.text());
            row.put("hash", hash);
            row.put("embedding", null);
            rows.add(row);
            if (settings.embeddingEnabled() && !hash.equals(existing.get(p.id()))) toEmbed.add(i);
        }
        if (!toEmbed.isEmpty()) {
            try {
                List<List<Double>> vectors = voyage.embedDocuments(toEmbed.stream().map(i -> pieces.get(i).embedInput()).toList());
                for (int k = 0; k < toEmbed.size(); k++) rows.get(toEmbed.get(k)).put("embedding", vectors.get(k));
            } catch (AiException e) {
                // 임베딩이 실패하면 해시를 비워 두어 다음 저장(또는 전체 다시 맞추기) 때 다시 시도한다
                log.warn("임베딩 실패({}): {}", docKey, e.getMessage());
                toEmbed.forEach(i -> rows.get(i).put("hash", null));
            }
        }

        Map<String, Object> params = new HashMap<>();
        params.put("chunks", rows);
        params.put("docKey", docKey);
        params.put("docType", docType);
        params.put("docId", docId);
        if (!rows.isEmpty()) neo4j.run(UPSERT.formatted(label), params);
        neo4j.run(DELETE_STALE, Map.of("docKey", docKey, "ids", rows.stream().map(r -> r.get("id")).toList()));
    }

    private static List<String> nonBlank(String... values)
    {
        List<String> out = new ArrayList<>();
        for (String v : values) {
            if (v == null || v.isBlank()) break;   // 상위가 비면 하위는 무시
            out.add(v.trim());
        }
        return out;
    }
}
