package com.example.my_server.dto;

import com.example.my_server.domain.Post;
import com.example.my_server.domain.PostType;
import com.example.my_server.domain.TradePosition;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

/**
 * 게시글 상세용 응답 DTO.
 */
public record PostDetailResponse(
        Long id,
        String title,
        String username,
        String content,
        String filePath,
        PostType type,
        String ticker,
        TradePosition position,
        BigDecimal entryPrice,
        BigDecimal exitPrice,
        BigDecimal profitRate,
        String exchange,
        ZonedDateTime lastModifiedAt
) {
    public static PostDetailResponse from(Post post) {
        return new PostDetailResponse(
                post.getId(),
                post.getTitle(),
                post.getUsername(),
                post.getContent(),
                post.getFilePath(),
                post.getType(),
                post.getTicker(),
                post.getPosition(),
                post.getEntryPrice(),
                post.getExitPrice(),
                post.getProfitRate(),
                post.getExchange(),
                post.getLastModifiedAt()
        );
    }
}
