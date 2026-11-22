package com.example.my_server.controller.api;

import com.example.my_server.graph.GraphException;
import com.example.my_server.graph.GraphSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 지식 그래프(Neo4j) 관리 — 관리자 전용(SecurityConfig).
 *  GET  /api/graph/status  : 연결 여부, 라벨별 노드 수, 관계 종류별 수
 *  POST /api/graph/resync  : 그래프를 비우고 MySQL에서 전부 다시 만든다
 */
@RestController
@RequestMapping("/api/graph")
public class ApiGraphController
{
    private final GraphSyncService graph;

    public ApiGraphController(GraphSyncService graph)
    {
        this.graph = graph;
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
