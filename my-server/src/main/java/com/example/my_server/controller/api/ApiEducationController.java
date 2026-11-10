package com.example.my_server.controller.api;

import com.example.my_server.domain.Education;
import com.example.my_server.dto.EducationDetailResponse;
import com.example.my_server.dto.EducationSummaryResponse;
import com.example.my_server.dto.EducationWriteRequest;
import com.example.my_server.service.EducationService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 수료한 교육 REST API. 조회(GET)는 누구나, 쓰기(등록/수정/삭제/파일 업로드)는 관리자만 (SecurityConfig 참고).
 * 수료증 PDF는 자격증과 같이 /{id}/certificate 로 메타데이터(JSON)와 분리했다.
 */
@RestController
@RequestMapping("/api/educations")
public class ApiEducationController {

    private final EducationService educationService;

    public ApiEducationController(EducationService educationService) {
        this.educationService = educationService;
    }

    @GetMapping
    public List<EducationSummaryResponse> list() {
        return educationService.list().stream()
                .map(EducationSummaryResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public EducationDetailResponse detail(@PathVariable Long id) {
        return EducationDetailResponse.from(educationService.findById(id));
    }

    @PostMapping
    public ResponseEntity<EducationDetailResponse> create(@Valid @RequestBody EducationWriteRequest request) {
        Education created = educationService.create(request.toEntity());
        return ResponseEntity.status(HttpStatus.CREATED).body(EducationDetailResponse.from(created));
    }

    @PutMapping("/{id}")
    public EducationDetailResponse update(@PathVariable Long id, @Valid @RequestBody EducationWriteRequest request) {
        Education updated = educationService.update(id, request.toEntity());
        return EducationDetailResponse.from(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        educationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/certificate")
    public EducationDetailResponse uploadCertificate(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return EducationDetailResponse.from(educationService.storeCertificateFile(id, file));
    }

    @DeleteMapping("/{id}/certificate")
    public EducationDetailResponse deleteCertificate(@PathVariable Long id) {
        return EducationDetailResponse.from(educationService.deleteCertificateFile(id));
    }

    // 조회는 permitAll — 포트폴리오 공개 전시 목적이므로 수료증도 공개 열람 대상.
    @GetMapping("/{id}/certificate")
    public ResponseEntity<Resource> viewCertificate(@PathVariable Long id) {
        Education education = educationService.findById(id);
        Resource resource = educationService.loadCertificateFile(id);

        String originalName = education.getCertificateOriginalName() != null
                ? education.getCertificateOriginalName()
                : "certificate.pdf";
        String encodedName = URLEncoder.encode(originalName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedName)
                .body(resource);
    }
}
