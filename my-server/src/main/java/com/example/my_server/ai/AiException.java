package com.example.my_server.ai;

/** 외부 AI API(Voyage·Claude) 호출 실패. */
public class AiException extends RuntimeException
{
    public AiException(String message) { super(message); }
    public AiException(String message, Throwable cause) { super(message, cause); }
}
