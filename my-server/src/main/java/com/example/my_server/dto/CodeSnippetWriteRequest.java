package com.example.my_server.dto;

import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.domain.CodeSnippetVariant;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Codebase 글 작성/수정 요청 DTO. 한 글에 여러 언어의 코드(variants)를 담는다. */
public record CodeSnippetWriteRequest(
        @NotBlank(message = "제목은 비워둘 수 없습니다.")
        @Size(max = 100, message = "제목은 100자를 넘을 수 없습니다.")
        String title,

        @Size(max = 30, message = "용도는 30자를 넘을 수 없습니다.")
        String category,

        @Size(max = 300, message = "설명은 300자를 넘을 수 없습니다.")
        String description,

        @NotEmpty(message = "언어별 코드는 하나 이상 필요합니다.")
        @Valid
        List<VariantRequest> variants,

        @Size(max = 500, message = "관련 기술은 500자를 넘을 수 없습니다.")
        String relatedSkills,

        @Size(max = 200, message = "관련 프로젝트는 200자를 넘을 수 없습니다.")
        String relatedProjectIds
) {
    /** 한 언어의 코드. */
    public record VariantRequest(
            @NotBlank(message = "언어는 비워둘 수 없습니다.")
            @Size(max = 30, message = "언어는 30자를 넘을 수 없습니다.")
            String language,

            @NotBlank(message = "내용은 비워둘 수 없습니다.")
            String content
    ) {}

    public CodeSnippet toEntity() {
        CodeSnippet snippet = new CodeSnippet();
        snippet.setTitle(title.trim());
        snippet.setCategory(category == null || category.isBlank() ? null : category.trim());
        snippet.setDescription(description == null || description.isBlank() ? null : description.trim());
        snippet.setRelatedSkills(RelationLists.normalize(relatedSkills, false));
        snippet.setRelatedProjectIds(RelationLists.normalize(relatedProjectIds, true));

        Set<String> seen = new HashSet<>();
        List<CodeSnippetVariant> list = new ArrayList<>();
        for (VariantRequest v : variants) {
            String language = v.language().trim();
            if (!seen.add(language.toLowerCase())) {
                throw new IllegalArgumentException("같은 언어가 두 번 들어 있습니다: " + language);
            }
            list.add(new CodeSnippetVariant(language, v.content(), list.size()));
        }
        snippet.replaceVariants(list);
        return snippet;
    }
}
