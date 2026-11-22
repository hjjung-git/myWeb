package com.example.my_server.ai;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

/**
 * 글 본문(마크다운)을 검색·임베딩용 조각으로 나눈다 — 순수 함수라 DB 없이 테스트한다.
 *  1) 제목(#, ##, …) 줄을 기준으로 절을 나눈다(코드 블록 안의 #는 제목이 아님).
 *  2) 절이 MAX_CHARS보다 길면 빈 줄(문단) 단위로 모아 자르고, 한 문단이 너무 길면 글자 수로 자른다.
 */
public final class TextChunker
{
    public static final int MAX_CHARS = 1200;

    private TextChunker() {}

    public static List<String> chunk(String markdown)
    {
        List<String> chunks = new ArrayList<>();
        for (String section : sections(markdown == null ? "" : markdown)) {
            if (section.isBlank()) continue;
            if (section.length() <= MAX_CHARS) {
                chunks.add(section.strip());
                continue;
            }
            StringBuilder cur = new StringBuilder();
            for (String para : section.split("\\n\\s*\\n")) {
                if (cur.length() > 0 && cur.length() + para.length() + 2 > MAX_CHARS) {
                    chunks.add(cur.toString().strip());
                    cur.setLength(0);
                }
                if (para.length() > MAX_CHARS) {
                    for (int i = 0; i < para.length(); i += MAX_CHARS) {
                        chunks.add(para.substring(i, Math.min(para.length(), i + MAX_CHARS)).strip());
                    }
                    continue;
                }
                if (cur.length() > 0) cur.append("\n\n");
                cur.append(para);
            }
            if (!cur.toString().isBlank()) chunks.add(cur.toString().strip());
        }
        chunks.removeIf(String::isBlank);
        return chunks;
    }

    static List<String> sections(String markdown)
    {
        List<String> sections = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inCode = false;
        for (String line : markdown.split("\\r?\\n", -1)) {
            String t = line.stripLeading();
            if (t.startsWith("```")) inCode = !inCode;
            if (!inCode && t.matches("#{1,6}\\s.*") && cur.length() > 0) {
                sections.add(cur.toString());
                cur.setLength(0);
            }
            cur.append(line).append('\n');
        }
        if (cur.length() > 0) sections.add(cur.toString());
        return sections;
    }

    public static String sha256(String text)
    {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
