package com.example.my_server.dto;

import com.example.my_server.domain.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 게시글 작성/수정 요청 DTO. 작성자 정보(username, user)는 클라이언트가 보내지 않고
 * 서버가 현재 로그인된 계정 기준으로 채운다 (PostServiceImpl.save 참고).
 */
public record PostWriteRequest(
        @NotBlank(message = "제목은 비워둘 수 없습니다.")
        @Size(max = 100, message = "제목은 100자를 넘을 수 없습니다.")
        String title,

        @NotBlank(message = "내용은 비워둘 수 없습니다.")
        String content,

        @Size(max = 50, message = "대분류는 50자를 넘을 수 없습니다.")
        String category,

        @Size(max = 50, message = "중분류는 50자를 넘을 수 없습니다.")
        String subcategory,

        @Size(max = 50, message = "소분류는 50자를 넘을 수 없습니다.")
        String minorCategory,

        // 포트폴리오와 엮기: 쉼표로 구분한 기술 이름들 / 프로젝트 id들 (선택)
        @Size(max = 500, message = "관련 기술은 500자를 넘을 수 없습니다.")
        String relatedSkills,

        @Size(max = 200, message = "관련 프로젝트는 200자를 넘을 수 없습니다.")
        String relatedProjectIds
) {
    public Post toEntity() {
        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setCategory(blankToNull(category));
        // 상위 분류 없이 하위 분류만 있는 건 트리에서 의미가 없어서 같이 비운다.
        post.setSubcategory(post.getCategory() == null ? null : blankToNull(subcategory));
        post.setMinorCategory(post.getSubcategory() == null ? null : blankToNull(minorCategory));
        post.setRelatedSkills(normalizeList(relatedSkills, false));
        post.setRelatedProjectIds(normalizeList(relatedProjectIds, true));
        return post;
    }

    // "a, b,,a" → "a,b" (앞뒤 공백 제거, 빈 항목·중복 제거). numeric이면 숫자 항목만 남긴다. 결과가 비면 null.
    private static String normalizeList(String value, boolean numeric) {
        if (value == null || value.isBlank()) return null;
        java.util.LinkedHashSet<String> items = new java.util.LinkedHashSet<>();
        for (String raw : value.split(",")) {
            String item = raw.trim();
            if (item.isEmpty() || (numeric && !item.matches("\\d+"))) continue;
            items.add(item);
        }
        return items.isEmpty() ? null : String.join(",", items);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
