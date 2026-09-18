package com.example.my_server.controller.api;

import com.example.my_server.domain.Post;
import com.example.my_server.domain.PostType;
import com.example.my_server.dto.PostDetailResponse;
import com.example.my_server.dto.PostSummaryResponse;
import com.example.my_server.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 게시글(매매일지/인사이트) 조회용 REST API.
 *
 * 브라운필드 마이그레이션 진행 중: 기존 PostController(SSR, Thymeleaf 뷰 반환)는
 * 그대로 두고, 같은 PostService를 재사용하는 별도의 JSON API를 추가하는 방식
 * (Strangler Fig 패턴)으로 만들었다. 아직 React 프론트엔드가 없어 이 API를
 * 실제로 소비하는 곳은 없지만, 이후 React 쪽에서 이 엔드포인트를 사용하게 되면
 * 기존 SSR 라우트를 점진적으로 걷어낼 예정이다.
 *
 * 쓰기(작성/수정/삭제) API는 아직 없다 — 인증이 필요 없는 /api/** 전체가
 * permitAll로 열려 있어서, 쓰기 API를 추가하려면 그 전에 세션 기반 인증을
 * JSON API에서 어떻게 다룰지(CSRF 토큰 전달 방식 등) 먼저 정해야 한다.
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
}
