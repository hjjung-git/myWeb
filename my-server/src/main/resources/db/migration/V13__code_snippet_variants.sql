-- Codebase 코드 글 하나에 여러 언어의 코드를 담는다(언어별로 같은 내용의 글을 따로 만들지 않기 위해).
-- 글(code_snippets)은 제목·용도·설명·관련 기술만 갖고, 언어별 코드는 code_snippet_variants에 둔다.
CREATE TABLE code_snippet_variants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    snippet_id BIGINT NOT NULL,
    language VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_code_snippet_variants_snippet (snippet_id),
    CONSTRAINT fk_code_snippet_variants_snippet FOREIGN KEY (snippet_id) REFERENCES code_snippets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기존 글의 언어·내용을 첫 번째 언어 코드로 옮긴다.
INSERT INTO code_snippet_variants (snippet_id, language, content, sort_order)
SELECT id, language, content, 0 FROM code_snippets;

-- 옛 컬럼은 지우지 않고 비워도 되게만 바꾼다(데이터 보존). 새 코드는 이 컬럼을 쓰지 않는다.
ALTER TABLE code_snippets
    MODIFY language VARCHAR(30) NULL,
    MODIFY content TEXT NULL;
