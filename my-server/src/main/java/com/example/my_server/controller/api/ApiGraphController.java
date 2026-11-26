package com.example.my_server.controller.api;

import com.example.my_server.ai.AiException;
import com.example.my_server.ai.RagService;
import com.example.my_server.graph.GraphException;
import com.example.my_server.graph.GraphSyncService;
import com.example.my_server.graph.GraphViewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 지식 그래프(Neo4j) — view·chunks(읽기 전용 조회)는 누구나, 나머지는 관리자 전용(SecurityConfig).
 *  GET  /api/graph/status  : 연결 여부, 라벨별 노드 수, 관계 종류별 수
 *  POST /api/graph/resync  : 그래프를 비우고 MySQL에서 전부 다시 만든다
 * 모니터링(읽기 전용):
 *  GET  /api/graph/view                 : 그래프 노드·관계(검색 조각 제외)
 *  GET  /api/graph/chunks?type=&id=     : 글·코드 하나의 검색 조각과 임베딩 여부
 *  POST /api/graph/search-test {query}  : 질문에 걸리는 조각(벡터·키워드·합친 순위) — 답변(Claude)은 만들지 않음
 */
@RestController
@RequestMapping("/api/graph")
public class ApiGraphController
{
    public record SearchTestRequest(String query) {}

    private final GraphSyncService graph;
    private final GraphViewService view;
    private final RagService rag;

    public ApiGraphController(GraphSyncService graph, GraphViewService view, RagService rag)
    {
        this.graph = graph;
        this.view = view;
        this.rag = rag;
    }

    @GetMapping("/view")
    public ResponseEntity<Map<String, Object>> view()
    {
        if (!graph.isEnabled()) return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(graph.status());
        try {
            return ResponseEntity.ok(view.view());
        } catch (GraphException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/chunks")
    public ResponseEntity<?> chunks(@RequestParam String type, @RequestParam long id)
    {
        try {
            return ResponseEntity.ok(view.chunks(type, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (GraphException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/search-test")
    public ResponseEntity<Map<String, Object>> searchTest(@RequestBody SearchTestRequest request)
    {
        String q = request == null || request.query() == null ? "" : request.query().strip();
        if (q.isEmpty() || q.length() > 500) return ResponseEntity.badRequest().body(Map.of("message", "질문을 1~500자로 입력해 주세요."));
        try {
            RagService.Retrieval r = rag.retrieve(q);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("vector", brief(r.vector()));
            out.put("keyword", brief(r.keyword()));
            out.put("fused", brief(r.fused()));
            return ResponseEntity.ok(out);
        } catch (AiException | GraphException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
        }
    }

    // 조각 본문은 앞부분만 보낸다
    private static List<Map<String, Object>> brief(List<Map<String, Object>> hits)
    {
        return hits.stream().map(h -> {
            Map<String, Object> m = new LinkedHashMap<>(h);
            String text = String.valueOf(h.get("text"));
            m.put("text", text.length() > 240 ? text.substring(0, 240) + "…" : text);
            return m;
        }).toList();
    }

    @GetMapping("/status")
    public Map<String, Object> status()
    {
        return graph.status();
    }

    @PostMapping("/resync")
    public ResponseEntity<Map<String, Object>> resync()
    {
        if (!graph.isEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(graph.status());
        }
        try {
            return ResponseEntity.ok(graph.resyncAll());
        } catch (GraphException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("ok", false, "error", e.getMessage()));
        }
    }
}
