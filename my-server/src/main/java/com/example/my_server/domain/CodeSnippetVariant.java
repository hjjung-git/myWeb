package com.example.my_server.domain;

import jakarta.persistence.*;

/** 코드 글의 언어별 코드 하나 — 마크다운 원문(코드 블록 포함). */
@Entity
@Table(name = "code_snippet_variants")
public class CodeSnippetVariant
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "snippet_id")
    private CodeSnippet snippet;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected CodeSnippetVariant() {}

    public CodeSnippetVariant(String language, String content, int sortOrder)
    {
        this.language = language;
        this.content = content;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public String getLanguage() { return language; }
    public String getContent() { return content; }
    public int getSortOrder() { return sortOrder; }

    void setSnippet(CodeSnippet snippet) { this.snippet = snippet; }
}
