-- Codebase 코드 글에 '용도'(category)를 추가한다: 언어별 틀 안에서 재사용 알고리즘 / 효율적인 코드 / 짧은 표현 등으로 묶는다.
-- 기존 글은 NULL(미분류)로 둔다.
ALTER TABLE code_snippets
    ADD COLUMN category VARCHAR(30);
