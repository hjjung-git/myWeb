package com.example.my_server.controller.api;

import com.example.my_server.domain.Post;
import com.example.my_server.domain.PostType;
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
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * 게시글(매매일지/인사이트) 조회용 REST API.
 *
 * 브라운필드 마이그레이션 진행 중: 기존 PostController(SSR, Thymeleaf 뷰 반환)는
 * 그대로 두고, 같은 PostService를 재사용하는 별도의 JSON API를 추가하는 방식
 * (Strangler Fig 패턴)으로 만들었다. 아직 React 프론트엔드가 없어 이 API를
 * 실제로 소비하는 곳은 없지만, 이후 React 쪽에서 이 엔드포인트를 사용하게 되면
 * 기존 SSR 라우트를 점진적으로 걷어낼 예정이다.
 *
 * 쓰기(작성/수정/삭제)는 /api/auth/admin으로 관리자 모드가 된 세션에서만 가능하다
 * (SecurityConfig에서 이 컨트롤러의 POST/PUT/DELETE만 별도로 hasRole("ADMIN")으로
 * 막아뒀다 — GET은 여전히 permitAll). 매매일지(TRADE_LOG) 필수값 검증은 기존
 * PostController.validateTradeFields와 같은 규칙을 그대로 따른다.
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
            @RequestParam(required = false) PostType type,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page) {
        Pageable pageable = PageRequest.of(page, 15, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> posts = postService.list(keyword, type, pageable);
        return posts.map(PostSummaryResponse::from);
    }

    @GetMapping("/{id}")
    public PostDetailResponse detail(@PathVariable Long id) {
        return PostDetailResponse.from(postService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PostDetailResponse> create(@Valid @RequestBody PostWriteRequest request) throws IOException {
        validateTradeFields(request);
        Long id = postService.save(request.toEntity(), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(PostDetailResponse.from(postService.findById(id)));
    }

    @PutMapping("/{id}")
    public PostDetailResponse update(@PathVariable Long id, @Valid @RequestBody PostWriteRequest request) throws IOException {
        validateTradeFields(request);
        Post updated = postService.updatePost(id, request.toEntity(), null);
        return PostDetailResponse.from(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        postService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // 매매일지(TRADE_LOG) 타입일 때 필수 입력값 검증 (PostController.validateTradeFields와 동일 규칙)
    private void validateTradeFields(PostWriteRequest request) {
        if (request.type() != PostType.TRADE_LOG) return;

        if (!StringUtils.hasText(request.ticker()))
            throw new IllegalArgumentException("종목을 입력하세요.");
        if (request.position() == null)
            throw new IllegalArgumentException("포지션을 선택하세요.");
        if (request.entryPrice() == null)
            throw new IllegalArgumentException("진입가를 입력하세요.");
        if (request.exitPrice() == null)
            throw new IllegalArgumentException("청산가를 입력하세요.");
        if (!StringUtils.hasText(request.exchange()))
            throw new IllegalArgumentException("거래소를 입력하세요.");
    }
}
