package com.example.my_server.graph;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Neo4j Query API(HTTP) 클라이언트 — POST {uri}/db/{database}/query/v2 로 Cypher 한 문장을 보내고 결과 행을 받는다.
 * 별도 드라이버 의존성 없이 Spring의 RestClient만 쓴다. 문장 하나가 곧 트랜잭션 하나(자동 커밋)다.
 *
 * 설정(application.properties / 환경변수):
 *   myweb.graph.enabled  (GRAPH_ENABLED, 기본 false — 꺼져 있으면 아무 요청도 보내지 않는다)
 *   myweb.graph.uri      (NEO4J_HTTP_URI, 기본 http://localhost:7474)
 *   myweb.graph.database (NEO4J_DATABASE, 기본 neo4j)
 *   myweb.graph.username / password (NEO4J_USERNAME / NEO4J_PASSWORD)
 */
@Component
public class Neo4jHttpClient
{
    private final boolean enabled;
    private final String database;
    private final RestClient rest;

    public Neo4jHttpClient(@Value("${myweb.graph.enabled:false}") boolean enabled,
                           @Value("${myweb.graph.uri:http://localhost:7474}") String uri,
                           @Value("${myweb.graph.database:neo4j}") String database,
                           @Value("${myweb.graph.username:neo4j}") String username,
                           @Value("${myweb.graph.password:}") String password)
    {
        this.enabled = enabled;
        this.database = database;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3_000);
        factory.setReadTimeout(30_000);
        this.rest = RestClient.builder()
                .baseUrl(uri)
                // 본문을 한 번에 보내(Content-Length 포함) 프록시·서버 호환성을 높인다 — 요청이 작아서 부담 없음
                .requestFactory(new BufferingClientHttpRequestFactory(factory))
                .defaultHeaders(h -> h.setBasicAuth(username, password))
                .build();
    }

    public boolean isEnabled() { return enabled; }

    /** Cypher 한 문장 실행 → 행 목록(열 이름 → 값). 그래프가 꺼져 있으면 빈 목록. */
    public List<Map<String, Object>> run(String cypher, Map<String, Object> params)
    {
        if (!enabled) return List.of();

        // Query API는 문장 안의 줄바꿈을 허용하지 않으므로 공백 하나로 합친다(문자열 값은 전부 파라미터로 보낸다).
        Map<String, Object> body = Map.of("statement", oneLine(cypher), "parameters", params == null ? Map.of() : params);
        Map<?, ?> response;
        try {
            response = rest.post()
                    .uri("/db/{db}/query/v2", database)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            throw new GraphException("Neo4j 응답 오류 " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(), e);
        } catch (RestClientException e) {
            throw new GraphException("Neo4j에 연결하지 못했습니다: " + e.getMessage(), e);
        }
        return rowsOf(response);
    }

    public List<Map<String, Object>> run(String cypher) { return run(cypher, Map.of()); }

    static String oneLine(String cypher) { return cypher.replaceAll("\\s+", " ").trim(); }

    /** {"data":{"fields":[..],"values":[[..],..]}} → [{field: value}, ..]. 오류가 있으면 예외. */
    @SuppressWarnings("unchecked")
    static List<Map<String, Object>> rowsOf(Map<?, ?> response)
    {
        if (response == null) return List.of();
        Object errors = response.get("errors");
        if (errors instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            String message = first instanceof Map<?, ?> m ? m.get("code") + ": " + m.get("message") : String.valueOf(first);
            throw new GraphException("Cypher 오류 — " + message);
        }
        if (!(response.get("data") instanceof Map<?, ?> data)) return List.of();
        List<String> fields = (List<String>) data.get("fields");
        List<List<Object>> values = (List<List<Object>>) data.get("values");
        if (fields == null || values == null) return List.of();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (List<Object> v : values) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 0; i < fields.size(); i++) row.put(fields.get(i), i < v.size() ? v.get(i) : null);
            rows.add(row);
        }
        return rows;
    }
}
