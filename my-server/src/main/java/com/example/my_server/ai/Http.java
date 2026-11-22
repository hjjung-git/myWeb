package com.example.my_server.ai;

import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** 외부 API용 RestClient — 연결 5초, 응답 60초 제한, 본문은 한 번에(Content-Length) 보낸다. */
final class Http
{
    private Http() {}

    static RestClient client(String baseUrl)
    {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(60_000);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(new BufferingClientHttpRequestFactory(factory))
                .build();
    }
}
