package com.example.my_server.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Voyage 임베딩 API — POST /v1/embeddings {input, model, input_type}.
 * 글 조각은 input_type=document, 질문은 query로 보낸다(같은 공간의 벡터지만 검색 품질이 좋아진다).
 */
@Component
public class VoyageClient
{
    static final int BATCH = 32;

    private final AiSettings settings;
    private final RestClient rest;

    public VoyageClient(AiSettings settings, @Value("${myweb.ai.voyage-base-url:https://api.voyageai.com}") String baseUrl)
    {
        this.settings = settings;
        this.rest = Http.client(baseUrl);
    }

    public List<List<Double>> embedDocuments(List<String> texts) { return embed(texts, "document"); }

    public List<Double> embedQuery(String text) { return embed(List.of(text), "query").get(0); }

    @SuppressWarnings("unchecked")
    List<List<Double>> embed(List<String> texts, String inputType)
    {
        if (!settings.embeddingEnabled()) throw new AiException("VOYAGE_API_KEY가 설정되지 않았습니다.");
        List<List<Double>> out = new ArrayList<>();
        for (int from = 0; from < texts.size(); from += BATCH) {
            List<String> batch = texts.subList(from, Math.min(texts.size(), from + BATCH));
            Map<?, ?> response;
            try {
                response = rest.post().uri("/v1/embeddings")
                        .header("Authorization", "Bearer " + settings.voyageApiKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("input", batch, "model", settings.embeddingModel(), "input_type", inputType))
                        .retrieve()
                        .body(Map.class);
            } catch (RestClientResponseException e) {
                throw new AiException("Voyage 오류 " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(), e);
            } catch (RestClientException e) {
                throw new AiException("Voyage에 연결하지 못했습니다: " + e.getMessage(), e);
            }
            List<Map<String, Object>> data = response == null ? null : (List<Map<String, Object>>) response.get("data");
            if (data == null || data.size() != batch.size()) throw new AiException("Voyage 응답 형식이 예상과 다릅니다.");
            data.stream()
                    .sorted(Comparator.comparingInt(d -> ((Number) d.get("index")).intValue()))
                    .forEach(d -> out.add(((List<Number>) d.get("embedding")).stream().map(Number::doubleValue).toList()));
        }
        return out;
    }
}
