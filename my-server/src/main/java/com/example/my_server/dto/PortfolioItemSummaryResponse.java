package com.example.my_server.dto;

import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.PortfolioItemType;

/**
 * 메인 페이지 목록용 — 상세 본문(detailContent)은 뺀 요약 정보만.
 */
public record PortfolioItemSummaryResponse(
        Long id,
        PortfolioItemType type,
        String title,
        String summary,
        String periodText,
        String thumbnailPath
) {
    public static PortfolioItemSummaryResponse from(PortfolioItem item) {
        return new PortfolioItemSummaryResponse(
                item.getId(),
                item.getType(),
                item.getTitle(),
                item.getSummary(),
                item.getPeriodText(),
                item.getThumbnailPath()
        );
    }
}
