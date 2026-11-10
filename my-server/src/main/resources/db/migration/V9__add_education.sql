-- 수료한 교육 테이블. 교육명 / 기관 / 기간 / 배운 내용 / 결과물(프로젝트 링크, 수료증 PDF)을 담는다.
-- 수료증 PDF 파일 자체는 자격증과 마찬가지로 디스크(app.upload.dir/educations)에 두고,
-- 여기엔 저장 파일명/원본 파일명만 남긴다.

CREATE TABLE education (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    institution VARCHAR(150),
    period_text VARCHAR(100),
    description TEXT,
    project_url VARCHAR(255),
    certificate_stored_name VARCHAR(255),
    certificate_original_name VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
