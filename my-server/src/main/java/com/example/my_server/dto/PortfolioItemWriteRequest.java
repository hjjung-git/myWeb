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

        // 프로젝트는 요약이 필수, 경력은 요약을 쓰지 않는다(카드에 회사명+기간만 보임) — toEntity()에서 검사.
        @Size(max = 300, message = "요약은 300자를 넘을 수 없습니다.")
        String summary,

        String detailContent,
        String periodText,
        String techStack,
        String linkUrl,
        String thumbnailPath,

        @Size(max = 50, message = "고용형태는 50자를 넘을 수 없습니다.")
        String employmentType,

        @Size(max = 100, message = "부서는 100자를 넘을 수 없습니다.")
        String department,

        @Size(max = 50, message = "직급은 50자를 넘을 수 없습니다.")
        String jobRank,

        @Size(max = 500, message = "퇴직 사유는 500자를 넘을 수 없습니다.")
        String resignationReason,

        Integer displayOrder
) {
    public PortfolioItem toEntity() {
        boolean noSummary = summary == null || summary.isBlank();
        if (type == PortfolioItemType.PROJECT && noSummary) {
            // IllegalArgumentException은 ApiExceptionHandler에서 400으로 변환된다.
            throw new IllegalArgumentException("프로젝트는 요약을 비워둘 수 없습니다.");
        }

        PortfolioItem item = new PortfolioItem();
        item.setType(type);
        item.setTitle(title);
        // DB 컬럼이 NOT NULL이라 경력은 빈 문자열로 저장한다.
        item.setSummary(noSummary ? "" : summary);
        item.setDetailContent(detailContent);
        item.setPeriodText(periodText);
        item.setTechStack(techStack);
        item.setLinkUrl(linkUrl);
        item.setThumbnailPath(thumbnailPath);
        item.setEmploymentType(employmentType);
        item.setDepartment(department);
        item.setJobRank(jobRank);
        item.setResignationReason(resignationReason);
        item.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        return item;
    }
}
