package com.example.my_server.controller.api;

import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.dto.CodeSnippetDetailResponse;
import com.example.my_server.dto.CodeSnippetSummaryResponse;
import com.example.my_server.dto.CodeSnippetWriteRequest;
import com.example.my_server.service.CodeSnippetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Codebase(코드 저장소) REST API.
 * 조회(GET)는 누구나, 작성/수정/삭제는 관리자 모드에서만 (SecurityConfig 참고).
 */
@RestController
@RequestMapping("/api/snippets")
public class ApiCodeSnippetController {

    private final CodeSnippetService codeSnippetService;

    public ApiCodeSnippetController(CodeSnippetService codeSnippetService) {
        this.codeSnippetService = codeSnippetService;
    }

    @GetMapping
    public List<CodeSnippetSummaryResponse> list() {
        return codeSnippetService.list().stream().map(CodeSnippetSummaryResponse::from).toList();
    }

    @GetMapping("/{id}")
    public CodeSnippetDetailResponse detail(@PathVariable Long id) {
        return CodeSnippetDetailResponse.from(codeSnippetService.findById(id));
    }

    @PostMapping
    public ResponseEntity<CodeSnippetDetailResponse> create(@Valid @RequestBody CodeSnippetWriteRequest request) {
        CodeSnippet created = codeSnippetService.create(request.toEntity());
        return ResponseEntity.status(HttpStatus.CREATED).body(CodeSnippetDetailResponse.from(created));
    }

    @PutMapping("/{id}")
    public CodeSnippetDetailResponse update(@PathVariable Long id, @Valid @RequestBody CodeSnippetWriteRequest request) {
        return CodeSnippetDetailResponse.from(codeSnippetService.update(id, request.toEntity()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        codeSnippetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
