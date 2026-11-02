-- Archive 분류를 3단계(대분류 / 중분류 / 소분류)로 늘린다.
-- 기존 subcategory 컬럼은 그대로 "중분류"로 쓰고, 소분류 컬럼만 새로 추가한다 (기존 데이터는 그대로).
ALTER TABLE posts
    ADD COLUMN minor_category VARCHAR(50);
