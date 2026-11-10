package com.example.my_server.dto;

import com.example.my_server.domain.Education;

public record EducationDetailResponse(
        Long id,
        String name,
        String institution,
        String periodText,
        String description,
        String projectUrl,
        String certificateOriginalName,
        boolean hasCertificateFile,
        Integer displayOrder
) {
    public static EducationDetailResponse from(Education education) {
        return new EducationDetailResponse(
                education.getId(),
                education.getName(),
                education.getInstitution(),
                education.getPeriodText(),
                education.getDescription(),
                education.getProjectUrl(),
                education.getCertificateOriginalName(),
                education.getCertificateStoredName() != null,
                education.getDisplayOrder()
        );
    }
}
