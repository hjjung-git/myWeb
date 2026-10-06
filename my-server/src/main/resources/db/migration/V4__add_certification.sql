-- 자격증 테이블. 기존에는 프론트(Certifications.jsx)에 하드코딩되어 있던 4개 자격증을
-- DB로 옮기면서, 각 자격증에 합격확인증(PDF)과 합격일자를 붙일 수 있도록 만든다.
-- 파일 자체는 디스크(app.upload.dir)에 두고, 여기엔 저장 파일명/원본 파일명만 남긴다.

CREATE TABLE certification (
    id BIGINT NOT NULL AUTO_INCREMENT,
    mark VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    issuer VARCHAR(150),
    acquired_date DATE,
    certificate_stored_name VARCHAR(255),
    certificate_original_name VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기존에 하드코딩되어 있던 4개 자격증을 그대로 옮겨온다 (합격확인증/합격일자는 추후 관리자 화면에서 입력).
INSERT INTO certification (mark, name, issuer, display_order) VALUES
    ('SQL', 'SQLD', 'SQL 개발자', 0),
    ('IT', '정보처리기사', 'Engineer Information Processing', 1),
    ('LX', '리눅스마스터 2급', 'Linux Master Level 2', 2),
    ('KH', '한국사능력검정 심화 1급', 'Korean History Proficiency Test', 3);
