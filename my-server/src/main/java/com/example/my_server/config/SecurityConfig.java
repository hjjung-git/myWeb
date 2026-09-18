package com.example.my_server.config;

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

// 로그인은 폼이 아니라 /api/auth/admin(관리자 코드 입력)로만 들어온다.
// 그래서 formLogin 설정과 그 전용 성공/실패 핸들러는 더 이상 필요 없다.
@Configuration
@EnableWebSecurity
public class SecurityConfig
{
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder()
    { return new BCryptPasswordEncoder(); }

    // /api/auth/admin(관리자 코드 로그인)에서 기존 로그인 체계를 그대로 재사용하기 위해 노출
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception
    { return config.getAuthenticationManager(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception
    {
        http
                // 접근 권한
                .authorizeHttpRequests((auth) -> auth
                        // /api/posts는 조회(GET)는 누구나, 쓰기(POST/PUT/DELETE)는 관리자만
                        // — 아래 permitAll("/api/**")보다 먼저 와야 우선 적용된다
                        .requestMatchers(HttpMethod.POST, "/api/posts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/posts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/portfolio-items/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/portfolio-items/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/portfolio-items/**").hasRole("ADMIN")
                        .requestMatchers("/", "/main/list/**", "/panel/**", "/api/**", "/user/**", "/uploads/**", "/h2-console/**", "/css/**", "/js/**").permitAll()
                        .requestMatchers("/portfolio/**").authenticated()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/post/delete/**").hasAnyRole("ADMIN", "USER")
                        .anyRequest().authenticated()
                )

                // 로그아웃
                .logout((logout) -> logout
                        .logoutUrl("/user/logout")
                        .logoutSuccessUrl("/main/list")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
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
