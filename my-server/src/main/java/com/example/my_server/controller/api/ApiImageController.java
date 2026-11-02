package com.example.my_server.controller.api;

import com.example.my_server.domain.PostImage;
import com.example.my_server.dto.ImageUploadResponse;
import com.example.my_server.service.PostImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

/**
 * Archive 글에 넣는 이미지 업로드/조회 API.
 * 업로드(POST)는 관리자 모드에서만(SecurityConfig), 조회(GET)는 누구나 — 글을 읽는 사람도 이미지를 봐야 하므로.
 */
@RestController
@RequestMapping("/api/images")
public class ApiImageController {

    private final PostImageService postImageService;

    public ApiImageController(PostImageService postImageService) {
        this.postImageService = postImageService;
    }

    @PostMapping
    public ResponseEntity<ImageUploadResponse> upload(@RequestParam("file") MultipartFile file) {
        PostImage saved = postImageService.store(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ImageUploadResponse(saved.getId(), "/api/images/" + saved.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> view(@PathVariable Long id) {
        PostImage image = postImageService.findById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                // 한 번 올린 이미지는 id가 바뀌지 않는 한 내용도 바뀌지 않으므로 브라우저가 오래 캐시해도 된다.
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(image.getData());
    }
}
