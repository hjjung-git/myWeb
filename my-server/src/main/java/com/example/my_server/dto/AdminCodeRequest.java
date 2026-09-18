package com.example.my_server.dto;

/**
 * 관리자 모드 전환 요청 — 아이디 없이 코드 하나만 받는다.
 */
public record AdminCodeRequest(String code) {}
