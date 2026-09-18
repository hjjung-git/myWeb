package com.example.my_server.dto;

import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.PortfolioItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PortfolioItemWriteRequest(
        @NotNull(message = "유형(프로젝트/경력)을 선택하세요.")
        PortfolioItemType type,

        @NotBlank(message = "제목은 비워둘 수 없습니다.")
        @Size(max = 100, message = "제목은 100자를 넘을 수 없습니다.")
        String title,

        @NotBlank(message = "요약은 비워둘 수 없습니다.")
        @Size(max = 300, message = "요약은 300자를 넘을 수 없습니다.")
        String summary,

        String detailContent,
        String periodText,
        String techStack,
        String linkUrl,
        String thumbnailPath,
        Integer displayOrder
) {
    public PortfolioItem toEntity() {
        PortfolioItem item = new PortfolioItem();
        item.setType(type);
        item.setTitle(title);
        item.setSummary(summary);
        item.setDetailContent(detailContent);
        item.setPeriodText(periodText);
        item.setTechStack(techStack);
        item.setLinkUrl(linkUrl);
        item.setThumbnailPath(thumbnailPath);
        item.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        return item;
    }
}
