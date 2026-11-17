package com.example.my_server.domain;

import jakarta.persistence.*;

import java.time.ZonedDateTime;

/**
 * Codebase의 코드 글 하나 — 프로젝트에 쓴 로직이나 공부하며 기록한 코드를 언어별로 모아 둔다.
 * content는 마크다운 원문(코드 블록 포함)이다.
 */
@Entity
@Table(name = "code_snippets")
public class CodeSnippet
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(length = 300)
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Archive 글과 같은 방식의 연결 — 쉼표로 구분한 기술 이름들 / 프로젝트(portfolio_item) id들
    @Column(length = 500)
    private String relatedSkills;

    @Column(length = 200)
    private String relatedProjectIds;

    private ZonedDateTime lastModifiedAt;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getLanguage() { return language; }
    public String getDescription() { return description; }
    public String getContent() { return content; }
    public String getRelatedSkills() { return relatedSkills; }
    public String getRelatedProjectIds() { return relatedProjectIds; }
    public ZonedDateTime getLastModifiedAt() { return lastModifiedAt; }

    public void setTitle(String title) { this.title = title; }
    public void setLanguage(String language) { this.language = language; }
    public void setDescription(String description) { this.description = description; }
    public void setContent(String content) { this.content = content; }
    public void setRelatedSkills(String relatedSkills) { this.relatedSkills = relatedSkills; }
    public void setRelatedProjectIds(String relatedProjectIds) { this.relatedProjectIds = relatedProjectIds; }

    @PrePersist
    @PreUpdate
    protected void touch()
    {
        this.lastModifiedAt = ZonedDateTime.now();
    }
}
