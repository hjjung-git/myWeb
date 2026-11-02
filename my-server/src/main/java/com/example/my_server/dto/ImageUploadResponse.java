package com.example.my_server.dto;

/** 이미지 업로드 결과 — 프론트는 url을 그대로 markdown 이미지 문법에 넣는다. */
public record ImageUploadResponse(Long id, String url) {
}
