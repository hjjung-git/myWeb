package com.example.my_server.dto;

import com.example.my_server.domain.CodeSnippet;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Codebase 글 작성/수정 요청 DTO. */
public record CodeSnippetWriteRequest(
        @NotBlank(message = "제목은 비워둘 수 없습니다.")
        @Size(max = 100, message = "제목은 100자를 넘을 수 없습니다.")
        String title,

        @NotBlank(message = "언어는 비워둘 수 없습니다.")
        @Size(max = 30, message = "언어는 30자를 넘을 수 없습니다.")
        String language,

        @Size(max = 300, message = "설명은 300자를 넘을 수 없습니다.")
        String description,

        @NotBlank(message = "내용은 비워둘 수 없습니다.")
        String content,

        @Size(max = 500, message = "관련 기술은 500자를 넘을 수 없습니다.")
        String relatedSkills,

        @Size(max = 200, message = "관련 프로젝트는 200자를 넘을 수 없습니다.")
        String relatedProjectIds
) {
    public CodeSnippet toEntity() {
        CodeSnippet snippet = new CodeSnippet();
        snippet.setTitle(title.trim());
        snippet.setLanguage(language.trim());
        snippet.setDescription(description == null || description.isBlank() ? null : description.trim());
        snippet.setContent(content);
        snippet.setRelatedSkills(RelationLists.normalize(relatedSkills, false));
        snippet.setRelatedProjectIds(RelationLists.normalize(relatedProjectIds, true));
        return snippet;
    }
}
