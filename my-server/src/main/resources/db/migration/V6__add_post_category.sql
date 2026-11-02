-- Archive를 대분류/소분류 트리로 보여주기 위한 분류 컬럼.
ALTER TABLE posts
    ADD COLUMN category VARCHAR(50),
    ADD COLUMN subcategory VARCHAR(50);

-- 기존 글은 제목 앞의 [접두어]를 대분류로 옮겨 둔다 (예: "[ToS] 261008 ..." -> 대분류 "ToS").
-- 접두어가 없는 글은 비워 두고, 화면에서 "미분류"로 보인다. 제목 자체는 바꾸지 않는다.
UPDATE posts
SET category = TRIM(SUBSTRING(title, 2, LOCATE(']', title) - 2))
WHERE title LIKE '[%'
  AND LOCATE(']', title) BETWEEN 3 AND 52;
