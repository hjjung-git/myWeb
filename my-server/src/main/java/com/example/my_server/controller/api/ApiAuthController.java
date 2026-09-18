package com.example.my_server.controller.api;

import com.example.my_server.dto.AdminCodeRequest;
import com.example.my_server.security.LoginAttemptService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 관리자 모드 전환 API.
 *
 * 포트폴리오 화면 어디서나(로그인 페이지가 아니라 상단 "설정" 버튼 같은 곳에서)
 * 아이디 없이 코드 하나만 입력해서 관리자 모드로 전환하는 용도.
 * 겉보기엔 "코드 입력"이지만, 내부적으로는 기존에 있던 Spring Security 로그인
 * 체계를 그대로 재사용한다 — 미리 만들어져 있는 고정 관리자 계정(admin)의
 * 비밀번호를 코드 자리에 넣어 인증하는 방식. 그래서 이 API로 관리자 모드에
 * 들어가면, 기존 hasRole("ADMIN") 기반 보호 규칙이 별도 작업 없이 그대로 적용된다.
 */
@RestController
@RequestMapping("/api/auth")
public class ApiAuthController {

    private static final String ADMIN_LOGIN_ID = "admin";

    private final AuthenticationManager authenticationManager;
    private final LoginAttemptService loginAttemptService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public ApiAuthController(AuthenticationManager authenticationManager,
                              LoginAttemptService loginAttemptService) {
        this.authenticationManager = authenticationManager;
        this.loginAttemptService = loginAttemptService;
    }

    // React 등 JSON 클라이언트가 상태를 바꾸는 요청(로그인 포함) 전에
    // 먼저 호출해서 CSRF 토큰을 받아가는 용도. 사이트는 CSRF 보호를 그대로 켜둔 채,
    // JSON 요청도 이 토큰을 헤더에 실어 보내는 방식으로 대응한다.
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of(
                "headerName", token.getHeaderName(),
                "token", token.getToken()
        );
    }

    @PostMapping("/admin")
    public Map<String, Object> loginAsAdmin(@RequestBody AdminCodeRequest request,
                                             HttpServletRequest httpRequest,
                                             HttpServletResponse httpResponse) {
        String ip = httpRequest.getRemoteAddr();

        // 기존 로그인 폼에 있던 IP 기반 시도 횟수 제한을 그대로 재사용
        if (loginAttemptService.isBlocked(ip)) {
            throw new BadCredentialsException("시도 횟수를 초과했습니다. 잠시 후 다시 시도하세요.");
        }

        try {
            Authentication authRequest =
                    new UsernamePasswordAuthenticationToken(ADMIN_LOGIN_ID, request.code());
            Authentication authResult = authenticationManager.authenticate(authRequest);

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authResult);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            loginAttemptService.loginSucceeded(ip);
            return Map.of("adminMode", true);
        } catch (Exception ex) {
            loginAttemptService.loginFailed(ip);
            throw ex;
        }
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest httpRequest) {
        httpRequest.getSession().invalidate();
        SecurityContextHolder.clearContext();
        return Map.of("adminMode", false);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return Map.of("adminMode", isAdmin);
    }
}
