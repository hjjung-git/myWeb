package com.example.my_server.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * AI(임베딩·챗봇) 설정 — 키는 저장소에 두지 않고 서버 환경변수(/etc/myweb.env)로만 넣는다.
 *   VOYAGE_API_KEY      임베딩(Voyage). 없으면 임베딩을 건너뛴다(그래프 동기화는 그대로).
 *   ANTHROPIC_API_KEY   답변(Claude). 없으면 챗봇을 끈다.
 *   CHAT_PUBLIC         true면 방문자도 사용(기본 false = 관리자만)
 */
@Component
public class AiSettings
{
    @Value("${myweb.ai.voyage-api-key:}") private String voyageApiKey;
    @Value("${myweb.ai.embedding-model:voyage-4-lite}") private String embeddingModel;
    @Value("${myweb.ai.embedding-dimensions:1024}") private int embeddingDimensions;
    @Value("${myweb.ai.anthropic-api-key:}") private String anthropicApiKey;
    @Value("${myweb.ai.chat-model:claude-haiku-5-5}") private String chatModel;
    @Value("${myweb.ai.chat-max-tokens:1024}") private int chatMaxTokens;
    @Value("${myweb.ai.chat-public:false}") private boolean chatPublic;
    @Value("${myweb.ai.chat-daily-limit-per-ip:10}") private int dailyLimitPerIp;
    @Value("${myweb.ai.chat-daily-limit-total:200}") private int dailyLimitTotal;

    public boolean embeddingEnabled() { return !voyageApiKey.isBlank(); }
    public boolean chatConfigured() { return !anthropicApiKey.isBlank(); }

    public String voyageApiKey() { return voyageApiKey; }
    public String embeddingModel() { return embeddingModel; }
    public int embeddingDimensions() { return embeddingDimensions; }
    public String anthropicApiKey() { return anthropicApiKey; }
    public String chatModel() { return chatModel; }
    public int chatMaxTokens() { return chatMaxTokens; }
    public boolean chatPublic() { return chatPublic; }
    public int dailyLimitPerIp() { return dailyLimitPerIp; }
    public int dailyLimitTotal() { return dailyLimitTotal; }
}
