package com.example.my_server.controller.api;

import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.PortfolioItemType;
import com.example.my_server.dto.PortfolioItemDetailResponse;
import com.example.my_server.dto.PortfolioItemSummaryResponse;
import com.example.my_server.dto.PortfolioItemWriteRequest;
import com.example.my_server.service.PortfolioItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 경력/프로젝트 소개용 포트폴리오 항목 REST API.
 * 조회(GET)는 누구나, 작성/수정/삭제는 관리자 모드에서만 (SecurityConfig 참고).
 */
@RestController
@RequestMapping("/api/portfolio-items")
public class ApiPortfolioItemController {

    private final PortfolioItemService portfolioItemService;

    public ApiPortfolioItemController(PortfolioItemService portfolioItemService) {
        this.portfolioItemService = portfolioItemService;
    }

    @GetMapping
    public List<PortfolioItemSummaryResponse> list(@RequestParam(required = false) PortfolioItemType type) {
        return portfolioItemService.list(type).stream()
                .map(PortfolioItemSummaryResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public PortfolioItemDetailResponse detail(@PathVariable Long id) {
        return PortfolioItemDetailResponse.from(portfolioItemService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PortfolioItemDetailResponse> create(@Valid @RequestBody PortfolioItemWriteRequest request) {
        PortfolioItem created = portfolioItemService.create(request.toEntity());
        return ResponseEntity.status(HttpStatus.CREATED).body(PortfolioItemDetailResponse.from(created));
    }

    @PutMapping("/{id}")
    public PortfolioItemDetailResponse update(@PathVariable Long id, @Valid @RequestBody PortfolioItemWriteRequest request) {
        PortfolioItem updated = portfolioItemService.update(id, request.toEntity());
        return PortfolioItemDetailResponse.from(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        portfolioItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
