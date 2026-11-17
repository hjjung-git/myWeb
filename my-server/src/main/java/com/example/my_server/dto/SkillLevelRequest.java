package com.example.my_server.dto;

/** 기술 레벨 저장 요청 한 줄 — 범위(0~100)와 이름은 컨트롤러에서 정리한다. */
public record SkillLevelRequest(String name, int level, boolean featured)
{
}
