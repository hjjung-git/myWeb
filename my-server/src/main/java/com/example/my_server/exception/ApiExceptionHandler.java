package com.example.my_server.exception;

import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * com.example.my_server.controller.api 패키지(REST API 컨트롤러) 전용 예외 처리.
 *
 * 레거시 SSR 컨트롤러를 모두 정리한 뒤로는 이 서버의 유일한 컨트롤러 계층이
 * controller.api 패키지뿐이라, 사실상 서버 전체의 예외 처리를 담당한다.
 * basePackages를 그대로 두는 이유는 앞으로 api 패키지 밖에 다른 컨트롤러가
 * 다시 생기더라도 이 핸들러가 의도치 않게 거기까지 적용되지 않도록 범위를
 * 명시적으로 좁혀두기 위함이다.
 */
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

    // 관리자 코드가 틀렸을 때 (ApiAuthController에서 authenticationManager.authenticate 실패 시)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationException ex) {
        return errorResponse(HttpStatus.UNAUTHORIZED, "코드가 올바르지 않습니다.");
    }

    // 잘못된 입력값 등
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return errorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // @Valid 검증 실패 (제목/내용 비어있음 등)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("입력값이 올바르지 않습니다.");
        return errorResponse(HttpStatus.BAD_REQUEST, message);
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
