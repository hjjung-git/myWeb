package com.example.my_server.dto;

import java.util.LinkedHashSet;
import java.util.Set;

/** 쉼표로 구분한 목록(관련 기술, 관련 프로젝트 id) 정리용 — Archive 글과 Codebase가 같이 쓴다. */
final class RelationLists
{
    private RelationLists() {}

    /** "a, b,,a" → "a,b" (앞뒤 공백·빈 항목·중복 제거). numeric이면 숫자 항목만 남긴다. 결과가 비면 null. */
    static String normalize(String value, boolean numeric)
    {
        if (value == null || value.isBlank()) return null;
        Set<String> items = new LinkedHashSet<>();
        for (String raw : value.split(","))
        {
            String item = raw.trim();
            if (item.isEmpty() || (numeric && !item.matches("\\d+"))) continue;
            items.add(item);
        }
        return items.isEmpty() ? null : String.join(",", items);
    }
}
