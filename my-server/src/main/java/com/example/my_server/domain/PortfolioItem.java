package com.example.my_server.domain;

import jakarta.persistence.*;

/**
 * 경력/프로젝트 소개용 포트폴리오 항목
 * 메인 페이지에는 요약(summary)만 보여주고, 필요한 항목만 상세(detailContent)로 연결하는
 * 구조를 위해 두 필드를 분리해뒀다. type으로 "프로젝트"와 "경력"을 함께 표현한다.
 */
@Entity
@Table(name = "portfolio_item")
public class PortfolioItem
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PortfolioItemType type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 300)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String detailContent;

    // 예: "2024.03 ~ 2024.09", "2025.01 ~ 진행 중"
    private String periodText;

    // MVP 단계라 콤마 구분 문자열로 단순화 (예: "Java, Spring Boot, MySQL")
    private String techStack;

    private String linkUrl;

    private String thumbnailPath;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    public Long getId() { return id; }
    public PortfolioItemType getType() { return type; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getDetailContent() { return detailContent; }
    public String getPeriodText() { return periodText; }
    public String getTechStack() { return techStack; }
    public String getLinkUrl() { return linkUrl; }
    public String getThumbnailPath() { return thumbnailPath; }
    public Integer getDisplayOrder() { return displayOrder; }

    public void setType(PortfolioItemType type) { this.type = type; }
    public void setTitle(String title) { this.title = title; }
    public void setSummary(String summary) { this.summary = summary; }
    public void setDetailContent(String detailContent) { this.detailContent = detailContent; }
    public void setPeriodText(String periodText) { this.periodText = periodText; }
    public void setTechStack(String techStack) { this.techStack = techStack; }
    public void setLinkUrl(String linkUrl) { this.linkUrl = linkUrl; }
    public void setThumbnailPath(String thumbnailPath) { this.thumbnailPath = thumbnailPath; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
