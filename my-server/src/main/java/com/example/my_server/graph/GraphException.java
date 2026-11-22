package com.example.my_server.graph;

/** Neo4j 요청 실패(연결 안 됨, 인증 실패, Cypher 오류 등). */
public class GraphException extends RuntimeException
{
    public GraphException(String message) { super(message); }
    public GraphException(String message, Throwable cause) { super(message, cause); }
}
