package com.example.my_server.graph;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MySQL 값(쉼표로 구분한 문자열 등)을 그래프에 넣을 파라미터로 바꾸는 순수 함수들 — DB 없이 단위 테스트한다.
 */
final class GraphMapping
{
    static final String PATH_SEPARATOR = " › ";

    private GraphMapping() {}

    /** 기술 이름 → 노드 키. 소문자, 괄호 설명 제거, 공백 정리. ("RDF/OWL (학습중)" → "rdf/owl") 비면 null. */
    static String skillKey(String name)
    {
        if (name == null) return null;
        String key = name.replaceAll("\\([^)]*\\)", " ").trim().replaceAll("\\s+", " ").toLowerCase();
        return key.isEmpty() ? null : key;
    }

    /** "Java, Spring Boot,  ,MySQL" → [{key:"java", name:"Java"}, ...] (키가 같은 것은 처음 것만) */
    static List<Map<String, Object>> skills(String csv)
    {
        Map<String, Map<String, Object>> byKey = new LinkedHashMap<>();
        for (String raw : split(csv)) {
            String key = skillKey(raw);
            if (key != null) byKey.putIfAbsent(key, Map.of("key", key, "name", raw));
        }
        return new ArrayList<>(byKey.values());
    }

    /** "3, 7,x, 3" → [3, 7] (숫자가 아닌 것·중복은 버림) */
    static List<Long> ids(String csv)
    {
        List<Long> ids = new ArrayList<>();
        for (String raw : split(csv)) {
            try {
                long id = Long.parseLong(raw);
                if (!ids.contains(id)) ids.add(id);
            } catch (NumberFormatException ignored) {
                // 잘못 들어간 값은 무시
            }
        }
        return ids;
    }

    static List<String> split(String csv)
    {
        List<String> out = new ArrayList<>();
        if (csv == null) return out;
        for (String part : csv.split(",")) {
            String t = part.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    /** 글의 분류 경로 — 상위가 비어 있으면 하위는 무시(프런트·백엔드와 같은 규칙). */
    static List<String> categoryNames(String category, String subcategory, String minorCategory)
    {
        List<String> names = new ArrayList<>();
        if (blank(category)) return names;
        names.add(category.trim());
        if (blank(subcategory)) return names;
        names.add(subcategory.trim());
        if (!blank(minorCategory)) names.add(minorCategory.trim());
        return names;
    }

    /** 분류 노드들: [{path:"CS", name:"CS", level:0}, {path:"CS › 기초", name:"기초", level:1}, ...] */
    static List<Map<String, Object>> categoryNodes(List<String> names)
    {
        List<Map<String, Object>> nodes = new ArrayList<>();
        for (int i = 0; i < names.size(); i++) {
            nodes.add(Map.of("path", pathOf(names, i), "name", names.get(i), "level", i));
        }
        return nodes;
    }

    /** 하위 → 상위 연결: [{child:"CS › 기초", parent:"CS"}, ...] */
    static List<Map<String, Object>> categoryLinks(List<String> names)
    {
        List<Map<String, Object>> links = new ArrayList<>();
        for (int i = 1; i < names.size(); i++) {
            links.add(Map.of("child", pathOf(names, i), "parent", pathOf(names, i - 1)));
        }
        return links;
    }

    /** 글이 직접 붙는 가장 깊은 분류 — 분류가 없으면 빈 목록 */
    static List<String> leafPath(List<String> names)
    {
        return names.isEmpty() ? List.of() : List.of(pathOf(names, names.size() - 1));
    }

    private static String pathOf(List<String> names, int lastIndex)
    {
        return String.join(PATH_SEPARATOR, names.subList(0, lastIndex + 1));
    }

    static boolean blank(String s) { return s == null || s.isBlank(); }
}
