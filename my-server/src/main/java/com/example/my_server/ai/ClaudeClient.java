package com.example.my_server.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Claude Messages API — POST /v1/messages. 답변 한 번(스트리밍 없음). */
@Component
public class ClaudeClient
{
    public record Message(String role, String content) {}
    public record Reply(String text, int inputTokens, int outputTokens, String stopReason) {}

    private final AiSettings settings;
    private final RestClient rest;

    public ClaudeClient(AiSettings settings, @Value("${myweb.ai.anthropic-base-url:https://api.anthropic.com}") String baseUrl)
    {
        this.settings = settings;
        this.rest = Http.client(baseUrl);
    }

    @SuppressWarnings("unchecked")
    public Reply complete(String system, List<Message> messages)
    {
        if (!settings.chatConfigured()) throw new AiException("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
        Map<String, Object> body = Map.of(
                "model", settings.chatModel(),
                "max_tokens", settings.chatMaxTokens(),
                "system", system,
                "messages", messages.stream().map(m -> Map.of("role", m.role(), "content", m.content())).toList());
        Map<?, ?> response;
        try {
            response = rest.post().uri("/v1/messages")
                    .header("x-api-key", settings.anthropicApiKey())
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            throw new AiException("Claude 오류 " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(), e);
        } catch (RestClientException e) {
            throw new AiException("Claude에 연결하지 못했습니다: " + e.getMessage(), e);
        }
        if (response == null) throw new AiException("Claude 응답이 비어 있습니다.");
        List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
        String text = content == null ? "" : content.stream()
                .filter(c -> "text".equals(c.get("type")))
                .map(c -> String.valueOf(c.get("text")))
                .collect(Collectors.joining());
        Map<String, Object> usage = (Map<String, Object>) response.get("usage");
        int in = usage == null ? 0 : ((Number) usage.getOrDefault("input_tokens", 0)).intValue();
        int out = usage == null ? 0 : ((Number) usage.getOrDefault("output_tokens", 0)).intValue();
        return new Reply(text, in, out, String.valueOf(response.get("stop_reason")));
    }
}
