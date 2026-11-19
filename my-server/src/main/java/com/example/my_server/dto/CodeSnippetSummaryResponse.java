package com.example.my_server.dto;

import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.domain.CodeSnippetVariant;

import java.time.ZonedDateTime;
import java.util.List;

/** Codebase 목록용 — 본문(variants의 content)은 뺀다. languages는 이 글이 가진 언어들. */
public record CodeSnippetSummaryResponse(
        Long id,
        String title,
        List<String> languages,
        String category,
        String description,
        String relatedSkills,
        String relatedProjectIds,
        ZonedDateTime lastModifiedAt
) {
    public static CodeSnippetSummaryResponse from(CodeSnippet s) {
        return new CodeSnippetSummaryResponse(
                s.getId(), s.getTitle(),
                s.getVariants().stream().map(CodeSnippetVariant::getLanguage).toList(),
                s.getCategory(), s.getDescription(),
                s.getRelatedSkills(), s.getRelatedProjectIds(), s.getLastModifiedAt());
    }
}
