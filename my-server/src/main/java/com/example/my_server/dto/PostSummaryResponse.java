package com.example.my_server.dto;

import com.example.my_server.domain.Post;
import com.example.my_server.domain.PostType;
import com.example.my_server.domain.TradePosition;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

/**
 * 게시글 목록용 응답 DTO.
 * 엔티티(Post)를 그대로 직렬화하지 않고 목록에 필요한 필드만 노출한다.
 */
public record PostSummaryResponse(
        Long id,
        String title,
        String username,
        PostType type,
        String ticker,
        TradePosition position,
        BigDecimal profitRate,
        ZonedDateTime lastModifiedAt
) {
    public static PostSummaryResponse from(Post post) {
        return new PostSummaryResponse(
                post.getId(),
                post.getTitle(),
                post.getUsername(),
                post.getType(),
                post.getTicker(),
                post.getPosition(),
                post.getProfitRate(),
                post.getLastModifiedAt()
        );
    }
}
