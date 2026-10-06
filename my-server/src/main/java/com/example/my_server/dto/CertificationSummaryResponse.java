package com.example.my_server.dto;

import com.example.my_server.domain.Certification;

/** 홈 화면 카드 목록용 — 합격일자/파일 원본명 같은 상세 정보는 뺀다. */
public record CertificationSummaryResponse(
        Long id,
        String mark,
        String name,
        String issuer,
        boolean hasCertificateFile
) {
    public static CertificationSummaryResponse from(Certification certification) {
        return new CertificationSummaryResponse(
                certification.getId(),
                certification.getMark(),
                certification.getName(),
                certification.getIssuer(),
                certification.getCertificateStoredName() != null
        );
    }
}
