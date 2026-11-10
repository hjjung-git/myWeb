package com.example.my_server.service;

import com.example.my_server.domain.Education;
import com.example.my_server.exception.PostNotFoundException;
import com.example.my_server.repository.EducationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class EducationServiceImpl implements EducationService
{
    // 수료증 PDF 저장 루트 — app.upload.dir 하위의 educations 폴더 (자격증은 certifications 폴더).
    @Value("${app.upload.dir}")
    private String uploadDir;

    private final EducationRepository educationRepository;

    public EducationServiceImpl(EducationRepository educationRepository)
    {
        this.educationRepository = educationRepository;
    }

    private Path educationsDir()
    {
        Path dir = Path.of(uploadDir, "educations");
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new UncheckedIOException("수료증 저장 디렉터리를 만들 수 없습니다.", e);
        }
        return dir;
    }

    @Override
    public List<Education> list()
    {
        return educationRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Override
    public Education findById(Long id)
    {
        // Post/PortfolioItem/Certification과 마찬가지로 "찾을 수 없음"은 공용 예외를 재사용한다.
        return educationRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("해당 교육을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public Education create(Education education)
    {
        return educationRepository.save(education);
    }

    @Override
    @Transactional
    public Education update(Long id, Education updated)
    {
        Education existing = findById(id);
        existing.setName(updated.getName());
        existing.setInstitution(updated.getInstitution());
        existing.setPeriodText(updated.getPeriodText());
        existing.setDescription(updated.getDescription());
        existing.setProjectUrl(updated.getProjectUrl());
        existing.setDisplayOrder(updated.getDisplayOrder());
        return existing;
    }

    @Override
    @Transactional
    public void delete(Long id)
    {
        Education existing = findById(id);
        deleteFileIfExists(existing.getCertificateStoredName());
        educationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Education storeCertificateFile(Long id, MultipartFile file)
    {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("PDF 파일만 업로드할 수 있습니다.");
        }

        Education existing = findById(id);

        // 기존 파일이 있으면 교체 전에 지운다 (디스크에 안 쓰는 파일이 계속 쌓이는 걸 막는다)
        deleteFileIfExists(existing.getCertificateStoredName());

        String storedName = UUID.randomUUID() + ".pdf";
        Path target = educationsDir().resolve(storedName);
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException("수료증 파일을 저장하지 못했습니다.", e);
        }

        existing.setCertificateStoredName(storedName);
        existing.setCertificateOriginalName(file.getOriginalFilename());
        return existing;
    }

    @Override
    @Transactional
    public Education deleteCertificateFile(Long id)
    {
        Education existing = findById(id);
        deleteFileIfExists(existing.getCertificateStoredName());
        existing.setCertificateStoredName(null);
        existing.setCertificateOriginalName(null);
        return existing;
    }

    @Override
    public Resource loadCertificateFile(Long id)
    {
        Education existing = findById(id);
        if (existing.getCertificateStoredName() == null) {
            throw new PostNotFoundException("등록된 수료증 파일이 없습니다.");
        }
        Path path = educationsDir().resolve(existing.getCertificateStoredName());
        if (!Files.exists(path)) {
            throw new PostNotFoundException("수료증 파일을 찾을 수 없습니다.");
        }
        return new FileSystemResource(path);
    }

    private void deleteFileIfExists(String storedName)
    {
        if (storedName == null) return;
        try {
            Files.deleteIfExists(educationsDir().resolve(storedName));
        } catch (IOException e) {
            // 파일 삭제 실패는 전체 요청을 막을 정도의 문제는 아니라 로그만 남기고 넘어간다.
            System.err.println("[WARN] 수료증 파일 삭제 실패: " + storedName + " / " + e.getMessage());
        }
    }
}
