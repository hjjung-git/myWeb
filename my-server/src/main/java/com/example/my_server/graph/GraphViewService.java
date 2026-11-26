package com.example.my_server.graph;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 모니터링용 읽기 전용 조회 — 정해진 Cypher만 실행한다(쓰기 없음).
 *  view()   : 그래프 전체(검색 조각 Chunk 제외) — 노드와 관계
 *  chunks() : 글·코드 하나의 검색 조각과 임베딩 여부
 */
@Service
public class GraphViewService
{
    static final String NODES = """
            MATCH (n) WHERE n:Note OR n:Code OR n:Skill OR n:Project OR n:Category OR n:Purpose
            OPTIONAL MATCH (c:Chunk)-[:PART_OF]->(n)
            WITH n, count(c) AS chunks, count(c.embedding) AS embedded
            RETURN elementId(n) AS id, labels(n)[0] AS label, coalesce(n.title, n.name, n.path) AS name,
                   n.id AS ref, n.path AS path, n.level AS level, n.featured AS featured, chunks, embedded
            """;
    static final String LINKS = """
            MATCH (a)-[r]->(b) WHERE NOT a:Chunk AND NOT b:Chunk
            RETURN elementId(a) AS source, elementId(b) AS target, type(r) AS type
            """;
    static final String CHUNKS = """
            MATCH (c:Chunk {docKey: $docKey})
            RETURN c.id AS id, c.idx AS idx, c.text AS text, size(c.text) AS length,
                   c.embedding IS NOT NULL AS embedded, size(c.embedding) AS dims
            ORDER BY c.idx
            """;

    private final Neo4jHttpClient neo4j;

    public GraphViewService(Neo4jHttpClient neo4j)
    {
        this.neo4j = neo4j;
    }

    public Map<String, Object> view()
    {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("nodes", neo4j.run(NODES));
        out.put("links", neo4j.run(LINKS));
        return out;
    }

    public List<Map<String, Object>> chunks(String docType, long docId)
    {
        if (!"note".equals(docType) && !"code".equals(docType)) throw new IllegalArgumentException("type은 note 또는 code");
        return new ArrayList<>(neo4j.run(CHUNKS, Map.of("docKey", docType + "-" + docId)));
    }
}
