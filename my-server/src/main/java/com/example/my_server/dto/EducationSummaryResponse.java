package com.example.my_server.dto;

import com.example.my_server.domain.Education;

/** 홈 화면 카드 목록용 — 배운 내용 전문 같은 상세 정보는 뺀다. */
public record EducationSummaryResponse(
        Long id,
        String name,
        String institution,
        String periodText,
        boolean hasCertificateFile,
        boolean hasProjectUrl
) {
    public static EducationSummaryResponse from(Education education) {
        return new EducationSummaryResponse(
                education.getId(),
                education.getName(),
                education.getInstitution(),
                education.getPeriodText(),
                education.getCertificateStoredName() != null,
                education.getProjectUrl() != null && !education.getProjectUrl().isBlank()
        );
    }
}
