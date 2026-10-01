-- 포트폴리오 사이트에서 제외 확정된 매매일지(TRADE_LOG)/뉴스(Article)/암호화폐
-- 보유현황(Holding) 기능을 코드와 함께 완전히 제거하면서 스키마도 정리한다.
-- (이 테이블들에 남아있던 기존 데이터는 이 마이그레이션으로 삭제된다.)

DROP TABLE IF EXISTS holding;
DROP TABLE IF EXISTS article;

ALTER TABLE posts
    DROP COLUMN type,
    DROP COLUMN ticker,
    DROP COLUMN position,
    DROP COLUMN entry_price,
    DROP COLUMN exit_price,
    DROP COLUMN profit_rate,
    DROP COLUMN exchange,
    DROP COLUMN file_path;
