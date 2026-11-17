-- Archive 글을 포트폴리오의 기술(Skills)·프로젝트와 엮는다.
-- 둘 다 쉼표로 구분한 문자열: related_skills는 기술 이름("Neo4j,Cypher"), related_project_ids는 portfolio_item의 id("3,5").
-- 기존 글은 NULL(연결 없음)로 그대로 둔다.
ALTER TABLE posts
    ADD COLUMN related_skills VARCHAR(500),
    ADD COLUMN related_project_ids VARCHAR(200);
