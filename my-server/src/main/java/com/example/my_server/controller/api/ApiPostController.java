package com.example.my_server.controller.api;

import com.example.my_server.domain.Post;
import com.example.my_server.dto.PostDetailResponse;
import com.example.my_server.dto.PostSummaryResponse;
import com.example.my_server.dto.PostWriteRequest;
import com.example.my_server.service.PostService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 글(아카이브/인사이트) 조회·작성용 REST API.
 *
 * 과거에는 매매일지(TRADE_LOG)도 같은 도메인에서 다뤘으나, 포트폴리오 사이트에서
 * 제외하기로 확정하면서 관련 코드(레거시 SSR PostController 포함)를 모두 정리했다.
 * 이제 이 컨트롤러가 글 조회/작성의 유일한 경로다.
 *
 * 쓰기(작성/수정/삭제)는 /api/auth/admin으로 관리자 모드가 된 세션에서만 가능하다
 * (SecurityConfig에서 이 컨트롤러의 POST/PUT/DELETE만 별도로 hasRole("ADMIN")으로
 * 막아뒀다 — GET은 여전히 permitAll).
 */
@RestController
@RequestMapping("/api/posts")
public class ApiPostController {

    private final PostService postService;

    public ApiPostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public Page<PostSummaryResponse> list(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page) {
        Pageable pageable = PageRequest.of(page, 15, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> posts = postService.list(keyword, pageable);
        return posts.map(PostSummaryResponse::from);
    }

    @GetMapping("/{id}")
    public PostDetailResponse detail(@PathVariable Long id) {
        return PostDetailResponse.from(postService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PostDetailResponse> create(@Valid @RequestBody PostWriteRequest request) {
        Long id = postService.save(request.toEntity());
        return ResponseEntity.status(HttpStatus.CREATED).body(PostDetailResponse.from(postService.findById(id)));
    }

    @PutMapping("/{id}")
    public PostDetailResponse update(@PathVariable Long id, @Valid @RequestBody PostWriteRequest request) {
        Post updated = postService.updatePost(id, request.toEntity());
        return PostDetailResponse.from(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        postService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
