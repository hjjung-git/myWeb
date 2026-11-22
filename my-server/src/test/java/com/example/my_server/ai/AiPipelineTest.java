package com.example.my_server.ai;

import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.domain.CodeSnippetVariant;
import com.example.my_server.domain.Post;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AiPipelineTest
{
    @Test
    @DisplayName("조각 나누기: 제목 기준, 코드 블록 안의 #는 제목 아님, 긴 절은 문단·글자 수로 자름")
    void chunk()
    {
        String md = "# 1. 공간\n\n소개\n\n## 둘\n\n```python\n# 주석\nx = 1\n```\n\n## 셋\n\n" + "가".repeat(3000);
        List<String> parts = TextChunker.chunk(md);
        assertEquals("# 1. 공간\n\n소개", parts.get(0));
        assertTrue(parts.get(1).startsWith("## 둘") && parts.get(1).contains("# 주석"));
        assertTrue(parts.stream().allMatch(p -> p.length() <= TextChunker.MAX_CHARS));
        assertEquals(3000, parts.stream().skip(2).mapToInt(p -> (int) p.chars().filter(c -> c == '가').count()).sum());
        assertTrue(TextChunker.chunk("").isEmpty());
        assertTrue(TextChunker.chunk(null).isEmpty());
        assertEquals(64, TextChunker.sha256("a").length());
    }

    @Test
    @DisplayName("글·코드 → 조각: id·임베딩 입력(제목·분류/용도·언어 머리말)")
    void pieces()
    {
        Post post = new Post("공간 복잡도", "admin", "# 하나\n\n본문");
        post.setId(23L);
        post.setCategory("CS");
        post.setMinorCategory("복잡도");   // 중분류가 비면 소분류는 무시
        ChunkSyncService.Piece p = ChunkSyncService.notePieces(post).get(0);
        assertEquals("note-23-0", p.id());
        assertEquals("제목: 공간 복잡도\n분류: CS\n\n# 하나\n\n본문", p.embedInput());

        CodeSnippet code = new CodeSnippet();
        code.setTitle("이진 탐색");
        code.setCategory("재사용 알고리즘");
        code.replaceVariants(List.of(new CodeSnippetVariant("Python", "x".repeat(5000), 0), new CodeSnippetVariant("Java", "y", 1)));
        List<ChunkSyncService.Piece> cs = ChunkSyncService.codePieces(code);
        assertEquals(2, cs.size());
        assertTrue(cs.get(0).embedInput().startsWith("제목: 이진 탐색\n용도: 재사용 알고리즘\n언어: Python"));
        assertTrue(cs.get(0).text().length() < 3100);
    }

    @Test
    @DisplayName("RRF 합치기: 두 목록 모두 상위면 먼저, 한 글에서 최대 2개, 전체 최대 6개")
    void fuse()
    {
        List<Map<String, Object>> vec = List.of(hit("a", 1), hit("b", 1), hit("c", 1), hit("d", 2));
        List<Map<String, Object>> key = List.of(hit("d", 2), hit("e", 3));
        List<Map<String, Object>> out = RagService.fuse(vec, key);
        assertEquals("d", out.get(0).get("id"));                  // 양쪽에 있어 점수 최고
        assertEquals(2, out.stream().filter(h -> h.get("docId").equals(1L)).count());   // a,b,c 중 2개만
        assertEquals(4, out.size());
    }

    @Test
    @DisplayName("Lucene 질의: 특수문자 이스케이프, 한 글자·물음표 제거, OR 연결")
    void lucene()
    {
        assertEquals("C\\+\\+ OR 포인터는", RagService.luceneQuery("C++ 포인터는 ?"));
        assertEquals("", RagService.luceneQuery("a ?"));
        assertEquals("/archive/3", RagService.urlOf("note", 3));
        assertEquals("/codebase/4", RagService.urlOf("code", 4));
    }

    private static Map<String, Object> hit(String id, long docId)
    {
        return Map.of("id", id, "docType", "note", "docId", docId, "title", "t", "text", "x");
    }
}
