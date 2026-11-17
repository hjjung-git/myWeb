-- 기술 스택의 "내 숙련도"(관리자가 직접 정하는 값)와 홈에 보일 핵심 기술 여부.
-- 막대에서 채워지는 부분은 Archive 글·Codebase 코드·프로젝트 수로 프런트가 계산하므로 여기엔 저장하지 않는다.
CREATE TABLE skill_levels (
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Codebase — 프로젝트에 쓴 로직, 공부하며 기록한 코드를 언어별로 모아 두는 저장소.
-- content는 마크다운(코드 블록 포함) 원문. related_skills / related_project_ids는 Archive 글과 같은 쉼표 구분 문자열.
CREATE TABLE code_snippets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    language VARCHAR(30) NOT NULL,
    description VARCHAR(300),
    content TEXT NOT NULL,
    related_skills VARCHAR(500),
    related_project_ids VARCHAR(200),
    last_modified_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
