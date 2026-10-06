package com.example.my_server.domain;

import jakarta.persistence.*;

import java.time.LocalDate;

/**
 * 자격증 항목 — 기존에는 프론트(Certifications.jsx)에 하드코딩되어 있던 자격증 목록을 DB로 옮기면서,
 * 각 자격증을 클릭하면 합격확인증(PDF)과 합격일자를 확인할 수 있는 상세 페이지를 붙이기 위해 만들었다.
 * 증명서 파일 자체는 DB가 아니라 서버 로컬 디스크(app.upload.dir 하위 certifications 폴더)에 저장하고,
 * DB에는 저장 파일명(certificateStoredName)과 원본 파일명(certificateOriginalName)만 남긴다.
 * 상시 구동 기기를 아직 마련하기 전이라, 당장은 맥 로컬 개발 서버 디스크를 그대로 쓰고
 * 추후 기기를 옮기면 app.upload.dir 값만 바꾸면 된다 (claude/decisions.md 참고).
 */
@Entity
@Table(name = "certification")
public class Certification
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 카드에 보여줄 짧은 마크 (예: "SQL", "IT")
    @Column(nullable = false, length = 10)
    private String mark;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 150)
    private String issuer;

    // 합격일자 — 아직 입력 안 된 자격증도 있을 수 있어 nullable
    private LocalDate acquiredDate;

    // 실제 PDF가 저장된 파일명(UUID 기반, certifications 폴더 기준) — 업로드 전이면 null.
    @Column(length = 255)
    private String certificateStoredName;

    // 업로드했던 원본 파일명 — 다운로드/표시용. 저장 파일명은 충돌 방지를 위해 UUID로 따로 관리한다.
    @Column(length = 255)
    private String certificateOriginalName;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    public Long getId() { return id; }
    public String getMark() { return mark; }
    public String getName() { return name; }
    public String getIssuer() { return issuer; }
    public LocalDate getAcquiredDate() { return acquiredDate; }
    public String getCertificateStoredName() { return certificateStoredName; }
    public String getCertificateOriginalName() { return certificateOriginalName; }
    public Integer getDisplayOrder() { return displayOrder; }

    public void setMark(String mark) { this.mark = mark; }
    public void setName(String name) { this.name = name; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
    public void setAcquiredDate(LocalDate acquiredDate) { this.acquiredDate = acquiredDate; }
    public void setCertificateStoredName(String certificateStoredName) { this.certificateStoredName = certificateStoredName; }
    public void setCertificateOriginalName(String certificateOriginalName) { this.certificateOriginalName = certificateOriginalName; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
