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
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class EducationServiceImpl implements EducationService
{
    // 수료증·포스터 저장 루트 — app.upload.dir 하위의 educations 폴더 (자격증은 certifications 폴더).
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
        deleteFileIfExists(existing.getPosterStoredName());
        educationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Education storeCertificateFile(Long id, MultipartFile file)
    {
        Education existing = findById(id);
        String contentType = detectType(file, true);

        // 기존 파일이 있으면 교체 전에 지운다 (디스크에 안 쓰는 파일이 계속 쌓이는 걸 막는다)
        deleteFileIfExists(existing.getCertificateStoredName());

        String storedName = saveFile(file, contentType);
        existing.setCertificateStoredName(storedName);
        existing.setCertificateOriginalName(file.getOriginalFilename());
        existing.setCertificateContentType(contentType);
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
        existing.setCertificateContentType(null);
        return existing;
    }

    @Override
    public Resource loadCertificateFile(Long id)
    {
        return loadFile(findById(id).getCertificateStoredName(), "수료증");
    }

    @Override
    @Transactional
    public Education storePosterFile(Long id, MultipartFile file)
    {
        Education existing = findById(id);
        String contentType = detectType(file, false);

        deleteFileIfExists(existing.getPosterStoredName());

        String storedName = saveFile(file, contentType);
        existing.setPosterStoredName(storedName);
        existing.setPosterOriginalName(file.getOriginalFilename());
        existing.setPosterContentType(contentType);
        return existing;
    }

    @Override
    @Transactional
    public Education deletePosterFile(Long id)
    {
        Education existing = findById(id);
        deleteFileIfExists(existing.getPosterStoredName());
        existing.setPosterStoredName(null);
        existing.setPosterOriginalName(null);
        existing.setPosterContentType(null);
        return existing;
    }

    @Override
    public Resource loadPosterFile(Long id)
    {
        return loadFile(findById(id).getPosterStoredName(), "포스터");
    }

    // 파일 앞부분(매직 바이트)으로 실제 형식을 판별한다 — 클라이언트가 보낸 Content-Type만 믿지 않는다.
    // 반환값은 저장·응답에 쓰는 표준 형식 문자열. allowPdf=false면 이미지만 허용한다.
    private String detectType(MultipartFile file, boolean allowPdf)
    {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }
        byte[] head = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            throw new UncheckedIOException("파일을 읽지 못했습니다.", e);
        }

        if (allowPdf && read >= 5 && head[0] == '%' && head[1] == 'P' && head[2] == 'D' && head[3] == 'F' && head[4] == '-') {
            return "application/pdf";
        }
        if (read >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (read >= 8 && (head[0] & 0xFF) == 0x89 && head[1] == 'P' && head[2] == 'N' && head[3] == 'G') {
            return "image/png";
        }
        if (read >= 12 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P') {
            return "image/webp";
        }
        throw new IllegalArgumentException(allowPdf
                ? "PDF 또는 이미지(JPG, PNG, WebP) 파일만 업로드할 수 있습니다."
                : "이미지(JPG, PNG, WebP) 파일만 업로드할 수 있습니다.");
    }

    private String saveFile(MultipartFile file, String contentType)
    {
        String ext = switch (contentType) {
            case "application/pdf" -> ".pdf";
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            default -> ".webp";
        };
        String storedName = UUID.randomUUID() + ext;
        try {
            file.transferTo(educationsDir().resolve(storedName));
        } catch (IOException e) {
            throw new UncheckedIOException("파일을 저장하지 못했습니다.", e);
        }
        return storedName;
    }

    private Resource loadFile(String storedName, String label)
    {
        if (storedName == null) {
            throw new PostNotFoundException("등록된 " + label + " 파일이 없습니다.");
        }
        Path path = educationsDir().resolve(storedName);
        if (!Files.exists(path)) {
            throw new PostNotFoundException(label + " 파일을 찾을 수 없습니다.");
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
            System.err.println("[WARN] 첨부 파일 삭제 실패: " + storedName + " / " + e.getMessage());
        }
    }
}
