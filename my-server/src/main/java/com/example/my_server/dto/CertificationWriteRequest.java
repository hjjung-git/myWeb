package com.example.my_server.dto;

import com.example.my_server.domain.Certification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CertificationWriteRequest(
        @NotBlank(message = "마크는 비워둘 수 없습니다.")
        @Size(max = 10, message = "마크는 10자를 넘을 수 없습니다.")
        String mark,

        @NotBlank(message = "자격증명은 비워둘 수 없습니다.")
        @Size(max = 100, message = "자격증명은 100자를 넘을 수 없습니다.")
        String name,

        @Size(max = 150, message = "발급기관은 150자를 넘을 수 없습니다.")
        String issuer,

        LocalDate acquiredDate,
        Integer displayOrder
) {
    public Certification toEntity() {
        Certification certification = new Certification();
        certification.setMark(mark);
        certification.setName(name);
        certification.setIssuer(issuer);
        certification.setAcquiredDate(acquiredDate);
        certification.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        return certification;
    }
}
