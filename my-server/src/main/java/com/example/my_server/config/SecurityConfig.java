package com.example.my_server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// 로그인은 폼이 아니라 /api/auth/admin(관리자 코드 입력)로만 들어온다.
// 그래서 formLogin 설정과 그 전용 성공/실패 핸들러는 더 이상 필요 없다.
// 레거시 SSR 컨트롤러(/main/list, /panel/**, /post/**, /portfolio/** 등)와
// 제외 확정된 Article/Holding/매매일지 관련 코드를 모두 정리하면서, 이 서버는
// 이제 순수 REST API 서버다 — 뷰를 반환하는 컨트롤러가 없으므로 formLogin의
// 기본 로그아웃(logoutSuccessUrl 등) 설정도 더 이상 필요 없다.
@Configuration
@EnableWebSecurity
public class SecurityConfig
{
    // 로컬 개발(Vite 프록시)은 브라우저 기준으로 same-origin이라 이 값이 안 쓰이고,
    // 배포 후에만 실제로 적용된다(프론트는 Cloudflare Pages, 백엔드는 Cloudflare Tunnel로 origin이 분리되므로).
    // 기본값은 로컬에서 vite dev server를 직접 다른 포트로 띄워 테스트할 때를 대비한 것.
    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String allowedOrigin;

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder()
    { return new BCryptPasswordEncoder(); }

    @Bean
    public CorsConfigurationSource corsConfigurationSource()
    {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "X-CSRF-TOKEN"));
        // 세션 쿠키/CSRF 쿠키를 cross-origin 요청에도 실어 보내려면 필요 (프론트의 credentials: 'include'와 짝)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // /api/auth/admin(관리자 코드 로그인)에서 기존 로그인 체계를 그대로 재사용하기 위해 노출
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception
    { return config.getAuthenticationManager(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception
    {
        http
                // CORS: 배포 후 프론트(Cloudflare Pages)·백엔드(Cloudflare Tunnel) origin 분리에 대응
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 접근 권한
                .authorizeHttpRequests((auth) -> auth
                        // /api/posts, /api/portfolio-items, /api/certifications는 조회(GET)는 누구나, 쓰기(POST/PUT/DELETE)는 관리자만
                        // — 아래 permitAll("/api/**")보다 먼저 와야 우선 적용된다
                        .requestMatchers(HttpMethod.POST, "/api/posts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/posts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/portfolio-items/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/portfolio-items/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/portfolio-items/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/certifications/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/certifications/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/certifications/**").hasRole("ADMIN")
                        .requestMatchers("/api/**", "/h2-console/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

                // CSRF : H2 콘솔 경로만 제외하고 활성화
                .csrf((csrf) -> csrf
                        .ignoringRequestMatchers("/h2-console/**")
                )

                // 보안 헤더
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin())         // H2 콘솔 iframe 허용 (same origin만)
                        .contentTypeOptions(ct -> {})                      // X-Content-Type-Options: nosniff
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN)
                        )
                );

        return http.build();
    }
}
