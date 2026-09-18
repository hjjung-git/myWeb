-- 경력/프로젝트 소개용 포트폴리오 항목 테이블.
-- V1과 달리 이 스크립트는 실제로 baseline 이후 처음 실행되는 진짜 마이그레이션이다
-- (기존 로컬 DB에는 이 테이블이 없으므로 Flyway가 이 스크립트를 그대로 실행한다).

CREATE TABLE portfolio_item (
    id BIGINT NOT NULL AUTO_INCREMENT,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    summary VARCHAR(300) NOT NULL,
    detail_content TEXT,
    period_text VARCHAR(255),
    tech_stack VARCHAR(255),
    link_url VARCHAR(255),
    thumbnail_path VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
