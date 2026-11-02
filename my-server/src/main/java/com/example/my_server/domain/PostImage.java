package com.example.my_server.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Archive 글(markdown) 안에 넣는 이미지.
 *
 * 자격증 PDF(디스크 저장)와 달리 이미지는 DB(LONGBLOB)에 바로 저장한다 — 서버를 라즈베리파이 등
 * 다른 기기로 옮길 때 DB 백업 하나만 옮기면 글과 이미지가 함께 따라오게 하기 위해서다.
 * 글 본문에는 "![설명](/api/images/{id})" 형태의 일반 markdown 이미지 문법으로 들어간다.
 */
@Entity
@Table(name = "post_image")
public class PostImage
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String originalName;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private long size;

    // 목록 조회 등에서 이 엔티티를 쓰는 곳이 없어서 지연 로딩 없이 단순하게 둔다(조회는 항상 단건).
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] data;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate()
    {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public long getSize() { return size; }
    public byte[] getData() { return data; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public void setSize(long size) { this.size = size; }
    public void setData(byte[] data) { this.data = data; }
}
