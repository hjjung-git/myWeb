package com.example.my_server.dto;

import com.example.my_server.domain.CodeSnippet;

import java.time.ZonedDateTime;

public record CodeSnippetDetailResponse(
        Long id,
        String title,
        String language,
        String description,
        String content,
        String relatedSkills,
        String relatedProjectIds,
        ZonedDateTime lastModifiedAt
) {
    public static CodeSnippetDetailResponse from(CodeSnippet s) {
        return new CodeSnippetDetailResponse(
                s.getId(), s.getTitle(), s.getLanguage(), s.getDescription(), s.getContent(),
                s.getRelatedSkills(), s.getRelatedProjectIds(), s.getLastModifiedAt());
    }
}
