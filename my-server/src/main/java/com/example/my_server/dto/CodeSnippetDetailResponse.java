package com.example.my_server.dto;

import com.example.my_server.domain.CodeSnippet;

import java.time.ZonedDateTime;
import java.util.List;

public record CodeSnippetDetailResponse(
        Long id,
        String title,
        String category,
        String description,
        List<Variant> variants,
        String relatedSkills,
        String relatedProjectIds,
        ZonedDateTime lastModifiedAt
) {
    /** 한 언어의 코드. */
    public record Variant(String language, String content) {}

    public static CodeSnippetDetailResponse from(CodeSnippet s) {
        return new CodeSnippetDetailResponse(
                s.getId(), s.getTitle(), s.getCategory(), s.getDescription(),
                s.getVariants().stream().map(v -> new Variant(v.getLanguage(), v.getContent())).toList(),
                s.getRelatedSkills(), s.getRelatedProjectIds(), s.getLastModifiedAt());
    }
}
