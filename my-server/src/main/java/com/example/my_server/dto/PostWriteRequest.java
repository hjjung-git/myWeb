package com.example.my_server.dto;

import com.example.my_server.domain.Post;
import com.example.my_server.domain.PostType;
import com.example.my_server.domain.TradePosition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

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

        PostType type,
        String ticker,
        TradePosition position,
        BigDecimal entryPrice,
        BigDecimal exitPrice,
        String exchange
) {
    public Post toEntity() {
        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setType(type != null ? type : PostType.INSIGHT);
        post.setTicker(ticker);
        post.setPosition(position);
        post.setEntryPrice(entryPrice);
        post.setExitPrice(exitPrice);
        post.setExchange(exchange);
        return post;
    }
}
