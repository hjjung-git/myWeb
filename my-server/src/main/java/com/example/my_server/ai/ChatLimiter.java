package com.example.my_server.ai;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 하루 질문 수 제한(서버 메모리, 자정(서울)에 초기화) — 요금이 사용량만큼 나가므로 둔다.
 * 전체 한도는 관리자 포함 모두에게, IP 한도는 관리자가 아닐 때만 적용한다.
 */
@Component
public class ChatLimiter
{
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final AiSettings settings;
    private LocalDate day = LocalDate.now(SEOUL);
    private final AtomicInteger total = new AtomicInteger();
    private final ConcurrentHashMap<String, AtomicInteger> perIp = new ConcurrentHashMap<>();

    public ChatLimiter(AiSettings settings)
    {
        this.settings = settings;
    }

    /** 한도 안이면 하나 세고 null, 넘으면 이유. */
    public synchronized String tryAcquire(String ip, boolean admin)
    {
        LocalDate today = LocalDate.now(SEOUL);
        if (!today.equals(day)) {
            day = today;
            total.set(0);
            perIp.clear();
        }
        if (total.get() >= settings.dailyLimitTotal()) return "오늘 질문 한도(" + settings.dailyLimitTotal() + "회)를 모두 썼습니다.";
        AtomicInteger mine = perIp.computeIfAbsent(ip, k -> new AtomicInteger());
        if (!admin && mine.get() >= settings.dailyLimitPerIp()) return "오늘은 질문을 " + settings.dailyLimitPerIp() + "번까지 할 수 있습니다.";
        total.incrementAndGet();
        mine.incrementAndGet();
        return null;
    }

    public synchronized int usedToday() { return LocalDate.now(SEOUL).equals(day) ? total.get() : 0; }
}
