package com.example.my_server.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.ZonedDateTime;

@Entity
@Table(name = "posts")
public class Post
{
    // 이 필드가 테이블의 기본키(Primary Key)라고 알려줌
    @Id
    // 값이 자동으로 1씩 증가하게 설정
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 글 번호

    @NotBlank(message = "제목은 비워둘 수 없습니다.")
    @Size(max = 100, message = "제목은 100자를 넘을 수 없습니다.")
    @Column(nullable = false, length = 100)
    private String title; // 제목

    @Column(nullable = false)
    private String username; // 작성자

    @NotBlank(message = "내용은 비워둘 수 없습니다.")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // 글 내용

    // 엔티티 생성 및 업데이트 시 현재 시간을 자동으로 lastModifiedAt 필드에 저장
    @LastModifiedDate
    private ZonedDateTime lastModifiedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // --- 생성자 ---
    public Post() {}

    public Post(String title, String username, String content)
    {
        this.title = title;
        this.username = username;
        this.content = content;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public ZonedDateTime getLastModifiedAt() { return lastModifiedAt; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    // 이 엔티티가 DB에 처음 저장되기 직전(pre-persist) 실행
    @PrePersist
    protected void onCreate()
    {
        // 생성 시점의 시간을 설정
        this.lastModifiedAt = ZonedDateTime.now();
    }

    // 엔티티가 DB에서 업데이트되기 직전(pre-update)에 실행
    @PreUpdate
    protected void onUpdate()
    {
        // 수정 시점의 시간을 다시 설정
        this.lastModifiedAt = ZonedDateTime.now();
    }
}
