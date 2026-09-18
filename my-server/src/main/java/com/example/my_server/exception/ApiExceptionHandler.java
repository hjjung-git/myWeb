package com.example.my_server.exception;

import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * com.example.my_server.controller.api 패키지(REST API 컨트롤러) 전용 예외 처리.
 *
 * 기존 GlobalExceptionHandler(@ControllerAdvice)는 Thymeleaf 에러 뷰(error/404 등)를
 * 반환하도록 되어 있어, REST 컨트롤러에서 발생한 예외까지 그대로 넘어가면 JSON을
 * 기대하는 클라이언트(향후 React)에게 HTML이 내려가는 문제가 있다. API 패키지에만
 * 적용되는 @RestControllerAdvice를 따로 둬서 이 문제를 분리했다.
 */
// 같은 예외라도 범위 지정 없는 GlobalExceptionHandler(@ControllerAdvice)와
// 겹칠 수 있어, api 패키지에 대해서는 이쪽이 우선 적용되도록 순서를 명시한다.
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "com.example.my_server.controller.api")
public class ApiExceptionHandler {

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePostNotFound(PostNotFoundException ex) {
        return errorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex) {
        return errorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류 발생");
    }

    private ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message
        ));
    }
}
