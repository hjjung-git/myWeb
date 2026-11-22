package com.example.my_server.controller.api;

import com.example.my_server.ai.AiException;
import com.example.my_server.ai.AiSettings;
import com.example.my_server.ai.ChatLimiter;
import com.example.my_server.ai.ClaudeClient;
import com.example.my_server.ai.RagService;
import com.example.my_server.graph.GraphException;
import com.example.my_server.graph.Neo4jHttpClient;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Archive 홈의 AI 질문(Hybrid RAG).
 *  GET  /api/chat/status : 지금 이 사용자가 쓸 수 있는지(설정·공개 범위)
 *  POST /api/chat        : {question, history:[{question, answer}]} → {answer, sources[], …}
 * 기본은 관리자만(CHAT_PUBLIC=false). 공개로 바꾸면 IP·전체 하루 한도가 걸린다.
 */
@RestController
@RequestMapping("/api/chat")
public class ApiChatController
{
    private static final Logger log = LoggerFactory.getLogger(ApiChatController.class);
    static final int MAX_QUESTION = 500;
    static final int MAX_HISTORY = 2;

    public record Turn(String question, String answer) {}
    public record ChatRequest(String question, List<Turn> history) {}

    private final RagService rag;
    private final AiSettings settings;
    private final ChatLimiter limiter;
    private final Neo4jHttpClient neo4j;

    public ApiChatController(RagService rag, AiSettings settings, ChatLimiter limiter, Neo4jHttpClient neo4j)
    {
        this.rag = rag;
        this.settings = settings;
        this.limiter = limiter;
        this.neo4j = neo4j;
    }

    @GetMapping("/status")
    public Map<String, Object> status(Authentication auth)
    {
        Map<String, Object> out = new LinkedHashMap<>();
        String reason = unavailableReason(isAdmin(auth));
        out.put("available", reason == null);
        if (reason != null) out.put("reason", reason);
        out.put("public", settings.chatPublic());
        if (isAdmin(auth)) {
            out.put("model", settings.chatModel());
            out.put("embedding", settings.embeddingEnabled() ? settings.embeddingModel() : null);
            out.put("usedToday", limiter.usedToday());
            out.put("dailyLimitTotal", settings.dailyLimitTotal());
        }
        return out;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> ask(@RequestBody ChatRequest request, Authentication auth, HttpServletRequest http)
    {
        boolean admin = isAdmin(auth);
        String reason = unavailableReason(admin);
        if (reason != null) return error(admin || settings.chatPublic() ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.FORBIDDEN, reason);

        String question = request == null || request.question() == null ? "" : request.question().strip();
        if (question.isEmpty()) return error(HttpStatus.BAD_REQUEST, "질문을 입력해 주세요.");
        if (question.length() > MAX_QUESTION) return error(HttpStatus.BAD_REQUEST, "질문은 " + MAX_QUESTION + "자까지 쓸 수 있습니다.");

        String limited = limiter.tryAcquire(clientIp(http), admin);
        if (limited != null) return error(HttpStatus.TOO_MANY_REQUESTS, limited);

        try {
            RagService.Answer a = rag.ask(question, history(request.history()));
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("answer", a.answer());
            out.put("sources", a.sources());
            if (admin) {
                out.put("model", a.model());
                out.put("inputTokens", a.inputTokens());
                out.put("outputTokens", a.outputTokens());
            }
            return ResponseEntity.ok(out);
        } catch (AiException | GraphException e) {
            log.warn("AI 질문 실패: {}", e.getMessage());
            return error(HttpStatus.BAD_GATEWAY, admin ? e.getMessage() : "지금은 답변을 만들 수 없습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    private String unavailableReason(boolean admin)
    {
        if (!settings.chatPublic() && !admin) return "AI 질문은 관리자만 쓸 수 있습니다.";
        if (!settings.chatConfigured()) return "ANTHROPIC_API_KEY가 설정되지 않았습니다.";
        if (!neo4j.isEnabled()) return "지식 그래프(Neo4j)가 꺼져 있습니다.";
        return null;
    }

    /** 이전 대화(최근 MAX_HISTORY턴)만 이어 붙인다 — 자료는 다시 넣지 않아 토큰을 아낀다. */
    static List<ClaudeClient.Message> history(List<Turn> turns)
    {
        List<ClaudeClient.Message> out = new ArrayList<>();
        if (turns == null) return out;
        List<Turn> recent = turns.subList(Math.max(0, turns.size() - MAX_HISTORY), turns.size());
        for (Turn t : recent) {
            if (t == null || t.question() == null || t.answer() == null) continue;
            out.add(new ClaudeClient.Message("user", cut(t.question(), MAX_QUESTION)));
            out.add(new ClaudeClient.Message("assistant", cut(t.answer(), 2000)));
        }
        return out;
    }

    private static String cut(String s, int max) { return s.length() <= max ? s : s.substring(0, max); }

    private static boolean isAdmin(Authentication auth)
    {
        return auth != null && auth.isAuthenticated()
                && auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    // Cloudflare Tunnel 뒤에서는 실제 방문자 IP가 CF-Connecting-IP 헤더에 온다
    private static String clientIp(HttpServletRequest http)
    {
        String cf = http.getHeader("CF-Connecting-IP");
        return cf != null && !cf.isBlank() ? cf.strip() : http.getRemoteAddr();
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message)
    {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
