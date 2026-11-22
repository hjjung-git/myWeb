package com.example.my_server.graph;

/**
 * MySQL 쪽 데이터가 바뀌었다는 알림 — 커밋이 끝난 뒤 GraphSyncListener가 받아 그래프(Neo4j)에 반영한다.
 * 만들기·수정·삭제를 구분하지 않는다: 동기화할 때 MySQL에서 다시 읽어 있으면 갱신, 없으면 그래프에서 지운다.
 */
public record GraphChangedEvent(Kind kind, Long id)
{
    public enum Kind { NOTE, CODE, PROJECT, SKILLS }

    public static GraphChangedEvent note(Long id) { return new GraphChangedEvent(Kind.NOTE, id); }
    public static GraphChangedEvent code(Long id) { return new GraphChangedEvent(Kind.CODE, id); }
    public static GraphChangedEvent project(Long id) { return new GraphChangedEvent(Kind.PROJECT, id); }
    public static GraphChangedEvent skills() { return new GraphChangedEvent(Kind.SKILLS, null); }
}
