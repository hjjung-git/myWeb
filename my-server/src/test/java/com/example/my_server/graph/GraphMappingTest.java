package com.example.my_server.graph;

import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.domain.CodeSnippetVariant;
import com.example.my_server.domain.Post;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class GraphMappingTest
{
    @Test
    @DisplayName("기술 키: 소문자·괄호 설명 제거·공백 정리")
    void skillKey()
    {
        assertEquals("rdf/owl", GraphMapping.skillKey("RDF/OWL (학습중)"));
        assertEquals("spring boot", GraphMapping.skillKey("  Spring   Boot "));
        assertNull(GraphMapping.skillKey("  "));
        assertNull(GraphMapping.skillKey(null));
    }

    @Test
    @DisplayName("쉼표 목록 → 기술(키 중복 제거), id(숫자만·중복 제거)")
    void lists()
    {
        assertEquals(List.of(Map.of("key", "java", "name", "Java"), Map.of("key", "mysql", "name", "MySQL")),
                GraphMapping.skills("Java, ,MySQL, java"));
        assertEquals(List.of(3L, 7L), GraphMapping.ids("3, x, 7,3"));
        assertTrue(GraphMapping.skills(null).isEmpty());
    }

    @Test
    @DisplayName("분류 경로: 상위가 비면 하위는 무시, 노드·연결·가장 깊은 분류")
    void categories()
    {
        List<String> names = GraphMapping.categoryNames("CS", "기초", "복잡도");
        assertEquals(List.of("CS", "기초", "복잡도"), names);
        assertEquals(List.of("CS"), GraphMapping.categoryNames("CS", " ", "복잡도"));
        assertTrue(GraphMapping.categoryNames(null, "기초", null).isEmpty());

        assertEquals(Map.of("path", "CS › 기초", "name", "기초", "level", 1), GraphMapping.categoryNodes(names).get(1));
        assertEquals(List.of(Map.of("child", "CS › 기초", "parent", "CS"),
                        Map.of("child", "CS › 기초 › 복잡도", "parent", "CS › 기초")),
                GraphMapping.categoryLinks(names));
        assertEquals(List.of("CS › 기초 › 복잡도"), GraphMapping.leafPath(names));
        assertTrue(GraphMapping.leafPath(List.of()).isEmpty());
    }

    @Test
    @DisplayName("글·코드 → Cypher 파라미터: 없는 프로젝트 id는 빼고, 코드 언어는 기술로")
    void params()
    {
        Post post = new Post("공간 복잡도", "admin", "본문");
        post.setId(23L);
        post.setCategory("CS");
        post.setSubcategory("기초");
        post.setRelatedSkills("Python, Big-O");
        post.setRelatedProjectIds("1, 99");
        Map<String, Object> p = GraphSyncService.noteParams(post, Set.of(1L));
        assertEquals(23L, p.get("id"));
        assertEquals(List.of(1L), p.get("projectIds"));
        assertEquals(List.of("CS › 기초"), p.get("leaf"));
        assertEquals(2, ((List<?>) p.get("skills")).size());

        CodeSnippet code = new CodeSnippet();
        code.setTitle("이진 탐색");
        code.setCategory("재사용 알고리즘");
        code.replaceVariants(List.of(new CodeSnippetVariant("Python", "a", 0), new CodeSnippetVariant("Java", "b", 1)));
        Map<String, Object> c = GraphSyncService.codeParams(code, Set.of());
        assertEquals(List.of("Python", "Java"), c.get("languages"));
        assertEquals(List.of("재사용 알고리즘"), c.get("purposes"));
        assertEquals(List.of(Map.of("key", "python", "name", "Python"), Map.of("key", "java", "name", "Java")),
                c.get("languageSkills"));
    }

    @Test
    @DisplayName("Query API 응답 → 행, 오류 응답 → 예외, 문장은 한 줄로")
    void response()
    {
        Map<String, Object> ok = Map.of("data", Map.of("fields", List.of("name", "count"),
                "values", List.of(List.of("Note", 3), List.of("Code", 2))));
        assertEquals(List.of(Map.of("name", "Note", "count", 3), Map.of("name", "Code", "count", 2)),
                Neo4jHttpClient.rowsOf(ok));
        Map<String, Object> err = Map.of("errors", List.of(Map.of("code", "Neo.ClientError.Statement.SyntaxError", "message", "bad")));
        assertThrows(GraphException.class, () -> Neo4jHttpClient.rowsOf(err));
        assertEquals("MATCH (n) RETURN n", Neo4jHttpClient.oneLine("MATCH (n)\n   RETURN n\n"));
    }
}
