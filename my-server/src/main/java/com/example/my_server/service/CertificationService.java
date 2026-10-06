package com.example.my_server.service;

import com.example.my_server.domain.Certification;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CertificationService
{
    List<Certification> list();
    Certification findById(Long id);
    Certification create(Certification certification);
    Certification update(Long id, Certification updated);
    void delete(Long id);

    // 합격확인증 PDF 업로드 — 기존 파일이 있으면 교체(이전 파일은 디스크에서 삭제)한다.
    Certification storeCertificateFile(Long id, MultipartFile file);

    // 합격확인증 파일만 삭제 (자격증 메타데이터는 남긴다)
    Certification deleteCertificateFile(Long id);

    // 저장된 PDF를 읽어 응답으로 내려주기 위한 리소스
    Resource loadCertificateFile(Long id);
}
