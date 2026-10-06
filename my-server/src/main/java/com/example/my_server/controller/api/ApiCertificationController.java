package com.example.my_server.controller.api;

import com.example.my_server.domain.Certification;
import com.example.my_server.dto.CertificationDetailResponse;
import com.example.my_server.dto.CertificationSummaryResponse;
import com.example.my_server.dto.CertificationWriteRequest;
import com.example.my_server.service.CertificationService;
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
 * 자격증 REST API. 조회(GET)는 누구나, 쓰기(등록/수정/삭제/파일 업로드)는 관리자만 (SecurityConfig 참고).
 * 증명서 PDF 자체는 /{id}/certificate 로 별도 분리했다 — 메타데이터(JSON)와 파일(multipart)의
 * Content-Type이 다르기 때문에 같은 엔드포인트로 같이 받지 않는다.
 */
@RestController
@RequestMapping("/api/certifications")
public class ApiCertificationController {

    private final CertificationService certificationService;

    public ApiCertificationController(CertificationService certificationService) {
        this.certificationService = certificationService;
    }

    @GetMapping
    public List<CertificationSummaryResponse> list() {
        return certificationService.list().stream()
                .map(CertificationSummaryResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public CertificationDetailResponse detail(@PathVariable Long id) {
        return CertificationDetailResponse.from(certificationService.findById(id));
    }

    @PostMapping
    public ResponseEntity<CertificationDetailResponse> create(@Valid @RequestBody CertificationWriteRequest request) {
        Certification created = certificationService.create(request.toEntity());
        return ResponseEntity.status(HttpStatus.CREATED).body(CertificationDetailResponse.from(created));
    }

    @PutMapping("/{id}")
    public CertificationDetailResponse update(@PathVariable Long id, @Valid @RequestBody CertificationWriteRequest request) {
        Certification updated = certificationService.update(id, request.toEntity());
        return CertificationDetailResponse.from(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        certificationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/certificate")
    public CertificationDetailResponse uploadCertificate(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return CertificationDetailResponse.from(certificationService.storeCertificateFile(id, file));
    }

    @DeleteMapping("/{id}/certificate")
    public CertificationDetailResponse deleteCertificate(@PathVariable Long id) {
        return CertificationDetailResponse.from(certificationService.deleteCertificateFile(id));
    }

    // 조회는 permitAll이라 누구나 볼 수 있다 — 포트폴리오 공개 전시 목적이므로 합격확인증도 공개 열람 대상.
    @GetMapping("/{id}/certificate")
    public ResponseEntity<Resource> viewCertificate(@PathVariable Long id) {
        Certification certification = certificationService.findById(id);
        Resource resource = certificationService.loadCertificateFile(id);

        String originalName = certification.getCertificateOriginalName() != null
                ? certification.getCertificateOriginalName()
                : "certificate.pdf";
        String encodedName = URLEncoder.encode(originalName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                // inline: 다운로드 대신 브라우저에서 바로 보여주도록 (상세 페이지의 <object> 뷰어용)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedName)
                .body(resource);
    }
}
