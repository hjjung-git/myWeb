package com.example.my_server.dto;

import com.example.my_server.domain.Post;

import java.time.ZonedDateTime;

/**
 * 게시글 상세용 응답 DTO.
 */
public record PostDetailResponse(
        Long id,
        String title,
        String username,
        String content,
        ZonedDateTime lastModifiedAt
) {
    public static PostDetailResponse from(Post post) {
        return new PostDetailResponse(
                post.getId(),
                post.getTitle(),
                post.getUsername(),
                post.getContent(),
                post.getLastModifiedAt()
        );
    }
}
