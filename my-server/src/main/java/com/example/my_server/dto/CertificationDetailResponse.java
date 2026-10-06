package com.example.my_server.dto;

import com.example.my_server.domain.Certification;

import java.time.LocalDate;

public record CertificationDetailResponse(
        Long id,
        String mark,
        String name,
        String issuer,
        LocalDate acquiredDate,
        String certificateOriginalName,
        boolean hasCertificateFile,
        Integer displayOrder
) {
    public static CertificationDetailResponse from(Certification certification) {
        return new CertificationDetailResponse(
                certification.getId(),
                certification.getMark(),
                certification.getName(),
                certification.getIssuer(),
                certification.getAcquiredDate(),
                certification.getCertificateOriginalName(),
                certification.getCertificateStoredName() != null,
                certification.getDisplayOrder()
        );
    }
}
