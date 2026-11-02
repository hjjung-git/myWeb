-- Archive 글 안에 넣는 이미지. 파일을 디스크가 아니라 DB에 저장해서,
-- 서버를 다른 기기(라즈베리파이 등)로 옮길 때 DB 백업만으로 글과 이미지가 함께 옮겨지게 한다.
CREATE TABLE post_image (
    id BIGINT NOT NULL AUTO_INCREMENT,
    original_name VARCHAR(255),
    content_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    data LONGBLOB NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
