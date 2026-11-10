package com.example.my_server.service;

import com.example.my_server.domain.Education;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EducationService
{
    List<Education> list();
    Education findById(Long id);
    Education create(Education education);
    Education update(Long id, Education updated);
    void delete(Long id);

    // 수료증 PDF 업로드 — 기존 파일이 있으면 교체(이전 파일은 디스크에서 삭제)한다.
    Education storeCertificateFile(Long id, MultipartFile file);

    // 수료증 파일만 삭제 (교육 메타데이터는 남긴다)
    Education deleteCertificateFile(Long id);

    // 저장된 PDF를 읽어 응답으로 내려주기 위한 리소스
    Resource loadCertificateFile(Long id);
}
