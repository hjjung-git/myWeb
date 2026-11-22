package com.example.my_server.graph;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 글·코드·프로젝트·기술 레벨이 바뀌면(MySQL 커밋 후) 그래프에 반영한다.
 * - 전용 스레드 하나에서 차례로 처리한다: 웹 요청은 Neo4j를 기다리지 않고, 같은 글의 반영 순서도 섞이지 않는다.
 * - 그래프 반영이 실패해도 MySQL 저장은 이미 끝났으므로 로그만 남긴다. 어긋나면 관리자가 '전체 다시 맞추기'.
 */
@Component
public class GraphSyncListener
{
    private static final Logger log = LoggerFactory.getLogger(GraphSyncListener.class);

    private final GraphSyncService graph;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "graph-sync");
        t.setDaemon(true);
        return t;
    });

    public GraphSyncListener(GraphSyncService graph)
    {
        this.graph = graph;
    }

    // 트랜잭션 안에서 발행되면 커밋 뒤에, 트랜잭션 밖이면 바로 실행된다(fallbackExecution).
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onChanged(GraphChangedEvent event)
    {
        if (!graph.isEnabled()) return;
        executor.submit(() -> {
            try {
                switch (event.kind()) {
                    case NOTE -> graph.syncNote(event.id());
                    case CODE -> graph.syncCode(event.id());
                    case PROJECT -> graph.syncProject(event.id());
                    case SKILLS -> graph.syncSkills();
                }
            } catch (Exception e) {
                log.warn("그래프 반영 실패 ({} {}): {}", event.kind(), event.id(), e.getMessage());
            }
        });
    }

    // 서버가 뜨면 제약 조건(고유 키)을 만들어 둔다(이미 있으면 그대로).
    @EventListener(ApplicationReadyEvent.class)
    public void onReady()
    {
        if (!graph.isEnabled()) return;
        executor.submit(() -> {
            try {
                graph.ensureSchema();
                log.info("그래프(Neo4j) 연결 확인 — 제약 조건 준비 완료");
            } catch (Exception e) {
                log.warn("그래프(Neo4j) 준비 실패: {}", e.getMessage());
            }
        });
    }

    @PreDestroy
    public void shutdown()
    {
        executor.shutdown();
    }
}
