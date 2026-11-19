package com.example.my_server.domain;

import jakarta.persistence.*;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Codebase의 코드 글 하나 — 프로젝트에 쓴 로직이나 공부하며 기록한 코드를 언어별로 모아 둔다.
 * 한 글에 여러 언어의 코드(variants)를 담을 수 있고, 각 코드는 마크다운 원문(코드 블록 포함)이다.
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

    // 용도 — 언어 안에서 글을 묶는 소제목(예: 재사용 알고리즘, 효율적인 코드, 짧은 표현). 비워 두면 '기타'로 보인다.
    @Column(length = 30)
    private String category;

    @Column(length = 300)
    private String description;

    // 언어별 코드 — 같은 내용을 언어마다 글로 따로 만들지 않고 한 글에 모은다
    @OneToMany(mappedBy = "snippet", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<CodeSnippetVariant> variants = new ArrayList<>();

    // Archive 글과 같은 방식의 연결 — 쉼표로 구분한 기술 이름들 / 프로젝트(portfolio_item) id들
    @Column(length = 500)
    private String relatedSkills;

    @Column(length = 200)
    private String relatedProjectIds;

    private ZonedDateTime lastModifiedAt;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public List<CodeSnippetVariant> getVariants() { return variants; }
    public String getRelatedSkills() { return relatedSkills; }
    public String getRelatedProjectIds() { return relatedProjectIds; }
    public ZonedDateTime getLastModifiedAt() { return lastModifiedAt; }

    public void setTitle(String title) { this.title = title; }
    public void setCategory(String category) { this.category = category; }
    public void setDescription(String description) { this.description = description; }

    /** 언어별 코드를 통째로 바꾼다(없어진 언어는 삭제된다). */
    public void replaceVariants(List<CodeSnippetVariant> next)
    {
        List<CodeSnippetVariant> copy = new ArrayList<>(next);
        variants.clear();
        for (CodeSnippetVariant v : copy)
        {
            v.setSnippet(this);
            variants.add(v);
        }
        // 글 자체의 컬럼이 안 바뀌고 코드만 바뀌어도 수정 시각이 갱신되도록 직접 찍는다
        this.lastModifiedAt = ZonedDateTime.now();
    }

    public void setRelatedSkills(String relatedSkills) { this.relatedSkills = relatedSkills; }
    public void setRelatedProjectIds(String relatedProjectIds) { this.relatedProjectIds = relatedProjectIds; }

    @PrePersist
    @PreUpdate
    protected void touch()
    {
        this.lastModifiedAt = ZonedDateTime.now();
    }
}
