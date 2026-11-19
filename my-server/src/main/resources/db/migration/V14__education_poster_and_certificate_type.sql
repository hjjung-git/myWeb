-- 교육에 포스터 이미지 첨부를 추가하고, 수료증이 PDF뿐 아니라 이미지도 될 수 있게 파일 형식(content type)을 기록한다.
-- 포스터/수료증 파일 자체는 디스크(app.upload.dir/educations)에 두고 여기엔 저장 파일명·원본 파일명·형식만 남긴다.

ALTER TABLE education
    ADD COLUMN certificate_content_type VARCHAR(50),
    ADD COLUMN poster_stored_name VARCHAR(255),
    ADD COLUMN poster_original_name VARCHAR(255),
    ADD COLUMN poster_content_type VARCHAR(50);

-- 지금까지 올라간 수료증은 모두 PDF
UPDATE education
SET certificate_content_type = 'application/pdf'
WHERE certificate_stored_name IS NOT NULL;
