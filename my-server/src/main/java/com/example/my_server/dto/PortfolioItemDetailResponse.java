package com.example.my_server.dto;

import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.PortfolioItemType;

public record PortfolioItemDetailResponse(
        Long id,
        PortfolioItemType type,
        String title,
        String summary,
        String detailContent,
        String periodText,
        String techStack,
        String linkUrl,
        String thumbnailPath,
        String employmentType,
        String department,
        String jobRank,
        String resignationReason,
        Integer displayOrder
) {
    public static PortfolioItemDetailResponse from(PortfolioItem item) {
        return new PortfolioItemDetailResponse(
                item.getId(),
                item.getType(),
                item.getTitle(),
                item.getSummary(),
                item.getDetailContent(),
                item.getPeriodText(),
                item.getTechStack(),
                item.getLinkUrl(),
                item.getThumbnailPath(),
                item.getEmploymentType(),
                item.getDepartment(),
                item.getJobRank(),
                item.getResignationReason(),
                item.getDisplayOrder()
        );
    }
}
