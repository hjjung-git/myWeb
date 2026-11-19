package com.example.my_server.domain;

import jakarta.persistence.*;

/**
 * 수료한 교육 항목 — 교육명, 기관, 기간, 배운 내용, 결과물(프로젝트 링크, 수료증 PDF).
 * 수료증(PDF 또는 이미지)과 포스터(이미지)는 자격증과 같은 방식으로 디스크(app.upload.dir 하위 educations 폴더)에 저장하고,
 * DB에는 저장 파일명·원본 파일명·형식만 남긴다.
 */
@Entity
@Table(name = "education")
public class Education
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 150)
    private String institution;

    // 기간은 "2025.03 ~ 2025.08"처럼 자유 형식 문자열로 받는다 (경력의 periodText와 동일한 방식).
    @Column(length = 100)
    private String periodText;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 결과물 — 프로젝트 저장소/배포 주소
    @Column(length = 255)
    private String projectUrl;

    @Column(length = 255)
    private String certificateStoredName;

    @Column(length = 255)
    private String certificateOriginalName;

    // 수료증 형식 — application/pdf 또는 image/jpeg|png|webp
    @Column(length = 50)
    private String certificateContentType;

    // 포스터 이미지 (교육 1개당 1장)
    @Column(length = 255)
    private String posterStoredName;

    @Column(length = 255)
    private String posterOriginalName;

    @Column(length = 50)
    private String posterContentType;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getInstitution() { return institution; }
    public String getPeriodText() { return periodText; }
    public String getDescription() { return description; }
    public String getProjectUrl() { return projectUrl; }
    public String getCertificateStoredName() { return certificateStoredName; }
    public String getCertificateOriginalName() { return certificateOriginalName; }
    public String getCertificateContentType() { return certificateContentType; }
    public String getPosterStoredName() { return posterStoredName; }
    public String getPosterOriginalName() { return posterOriginalName; }
    public String getPosterContentType() { return posterContentType; }
    public Integer getDisplayOrder() { return displayOrder; }

    public void setName(String name) { this.name = name; }
    public void setInstitution(String institution) { this.institution = institution; }
    public void setPeriodText(String periodText) { this.periodText = periodText; }
    public void setDescription(String description) { this.description = description; }
    public void setProjectUrl(String projectUrl) { this.projectUrl = projectUrl; }
    public void setCertificateStoredName(String certificateStoredName) { this.certificateStoredName = certificateStoredName; }
    public void setCertificateOriginalName(String certificateOriginalName) { this.certificateOriginalName = certificateOriginalName; }
    public void setCertificateContentType(String certificateContentType) { this.certificateContentType = certificateContentType; }
    public void setPosterStoredName(String posterStoredName) { this.posterStoredName = posterStoredName; }
    public void setPosterOriginalName(String posterOriginalName) { this.posterOriginalName = posterOriginalName; }
    public void setPosterContentType(String posterContentType) { this.posterContentType = posterContentType; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
