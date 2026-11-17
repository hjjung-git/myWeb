package com.example.my_server.dto;

import com.example.my_server.domain.CodeSnippet;

import java.time.ZonedDateTime;

/** Codebase 목록용 — 본문(content)은 뺀다. */
public record CodeSnippetSummaryResponse(
        Long id,
        String title,
        String language,
        String description,
        String relatedSkills,
        String relatedProjectIds,
        ZonedDateTime lastModifiedAt
) {
    public static CodeSnippetSummaryResponse from(CodeSnippet s) {
        return new CodeSnippetSummaryResponse(
                s.getId(), s.getTitle(), s.getLanguage(), s.getDescription(),
                s.getRelatedSkills(), s.getRelatedProjectIds(), s.getLastModifiedAt());
    }
}
