package com.example.my_server.dto;

import com.example.my_server.domain.Education;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EducationWriteRequest(
        @NotBlank(message = "교육명은 비워둘 수 없습니다.")
        @Size(max = 100, message = "교육명은 100자를 넘을 수 없습니다.")
        String name,

        @Size(max = 150, message = "기관은 150자를 넘을 수 없습니다.")
        String institution,

        @Size(max = 100, message = "기간은 100자를 넘을 수 없습니다.")
        String periodText,

        String description,

        @Size(max = 255, message = "프로젝트 주소는 255자를 넘을 수 없습니다.")
        String projectUrl,

        Integer displayOrder
) {
    public Education toEntity() {
        Education education = new Education();
        education.setName(name);
        education.setInstitution(institution);
        education.setPeriodText(periodText);
        education.setDescription(description);
        education.setProjectUrl(projectUrl);
        education.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        return education;
    }
}
