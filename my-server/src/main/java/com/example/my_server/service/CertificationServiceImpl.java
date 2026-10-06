package com.example.my_server.service;

import com.example.my_server.domain.Certification;
import com.example.my_server.exception.PostNotFoundException;
import com.example.my_server.repository.CertificationRepository;
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
public class CertificationServiceImpl implements CertificationService
{
    // 증명서 PDF 저장 루트 — app.upload.dir(예: my-server/uploads) 하위의 certifications 폴더.
    // 상시 구동 기기가 없는 지금은 맥 로컬 디스크를 그대로 쓰고, 추후 기기를 옮기면
    // app.upload.dir 값만 바꾸면 된다 (claude/decisions.md 참고).
    @Value("${app.upload.dir}")
    private String uploadDir;

    private final CertificationRepository certificationRepository;

    public CertificationServiceImpl(CertificationRepository certificationRepository)
    {
        this.certificationRepository = certificationRepository;
    }

    private Path certificatesDir()
    {
        Path dir = Path.of(uploadDir, "certifications");
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new UncheckedIOException("증명서 저장 디렉터리를 만들 수 없습니다.", e);
        }
        return dir;
    }

    @Override
    public List<Certification> list()
    {
        return certificationRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Override
    public Certification findById(Long id)
    {
        // Post/PortfolioItem과 마찬가지로 "찾을 수 없음"은 공용 예외를 재사용한다.
        return certificationRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("해당 자격증을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public Certification create(Certification certification)
    {
        return certificationRepository.save(certification);
    }

    @Override
    @Transactional
    public Certification update(Long id, Certification updated)
    {
        Certification existing = findById(id);
        existing.setMark(updated.getMark());
        existing.setName(updated.getName());
        existing.setIssuer(updated.getIssuer());
        existing.setAcquiredDate(updated.getAcquiredDate());
        existing.setDisplayOrder(updated.getDisplayOrder());
        return existing;
    }

    @Override
    @Transactional
    public void delete(Long id)
    {
        Certification existing = findById(id);
        deleteFileIfExists(existing.getCertificateStoredName());
        certificationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Certification storeCertificateFile(Long id, MultipartFile file)
    {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("PDF 파일만 업로드할 수 있습니다.");
        }

        Certification existing = findById(id);

        // 기존 파일이 있으면 교체 전에 지운다 (디스크에 안 쓰는 파일이 계속 쌓이는 걸 막는다)
        deleteFileIfExists(existing.getCertificateStoredName());

        String storedName = UUID.randomUUID() + ".pdf";
        Path target = certificatesDir().resolve(storedName);
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException("증명서 파일을 저장하지 못했습니다.", e);
        }

        existing.setCertificateStoredName(storedName);
        existing.setCertificateOriginalName(file.getOriginalFilename());
        return existing;
    }

    @Override
    @Transactional
    public Certification deleteCertificateFile(Long id)
    {
        Certification existing = findById(id);
        deleteFileIfExists(existing.getCertificateStoredName());
        existing.setCertificateStoredName(null);
        existing.setCertificateOriginalName(null);
        return existing;
    }

    @Override
    public Resource loadCertificateFile(Long id)
    {
        Certification existing = findById(id);
        if (existing.getCertificateStoredName() == null) {
            throw new PostNotFoundException("등록된 증명서 파일이 없습니다.");
        }
        Path path = certificatesDir().resolve(existing.getCertificateStoredName());
        if (!Files.exists(path)) {
            throw new PostNotFoundException("증명서 파일을 찾을 수 없습니다.");
        }
        return new FileSystemResource(path);
    }

    private void deleteFileIfExists(String storedName)
    {
        if (storedName == null) return;
        try {
            Files.deleteIfExists(certificatesDir().resolve(storedName));
        } catch (IOException e) {
            // 파일 삭제 실패는 전체 요청을 막을 정도의 문제는 아니라 로그만 남기고 넘어간다.
            System.err.println("[WARN] 증명서 파일 삭제 실패: " + storedName + " / " + e.getMessage());
        }
    }
}
