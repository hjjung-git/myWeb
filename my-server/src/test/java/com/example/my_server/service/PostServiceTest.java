package com.example.my_server.service;

import com.example.my_server.domain.Post;
import com.example.my_server.domain.Role;
import com.example.my_server.domain.User;
import com.example.my_server.exception.PostNotFoundException;
import com.example.my_server.graph.GraphChangedEvent;
import com.example.my_server.repository.PostRepository;
import com.example.my_server.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PostServiceTest
{
    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    // 저장·수정·삭제 때 그래프(Neo4j) 반영 알림을 보낸다 — 테스트에서는 보냈는지만 확인
    @Mock
    private ApplicationEventPublisher events;

    @InjectMocks
    private PostServiceImpl postService;

    private Post post;

    @BeforeEach
    void setUp()
    {
        post = new Post("테스트 제목", "테스터", "테스트 내용");

        User user = new User("testUser", "password", Role.USER);
        Authentication authentication = new UsernamePasswordAuthenticationToken("user", null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void tearDown()
    { SecurityContextHolder.clearContext(); }

    @Test
    @DisplayName("게시글 저장 - 성공")
    void savePost_Success()
    {
        // given
        User user = new User("testUser", "password", Role.USER);
        given(userRepository.findByLoginId(any())).willReturn(Optional.of(user));

        // postRepository 저장 로직
        given(postRepository.save(any(Post.class))).willAnswer(invocation -> invocation.getArgument(0));

        // when
        Long savedId = postService.save(post);

        // then
        verify(userRepository).findByLoginId(any());
        verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("게시글 단건 조회 - 성공")
    void findById_Success()
    {
        // given
        Long postId = 1L;
        given(postRepository.findById(postId)).willReturn(Optional.of(post));

        // when
        Post foundPost = postService.findById(postId);

        // then
        assertNotNull(foundPost);
        assertEquals("테스트 제목", foundPost.getTitle());
        verify(postRepository).findById(postId);
    }

    @Test
    @DisplayName("게시글 단건 조회 - 실패 (게시글 없음)")
    void findById_Fail_NotFound()
    {
        // given
        Long postId = 99L;
        given(postRepository.findById(postId)).willReturn(Optional.empty());

        // when & then
        assertThrows(PostNotFoundException.class, () -> {
            postService.findById(postId);
        });
    }

    @Test
    @DisplayName("게시글 수정 - 성공")
    void updatePost_Success()
    {
        // given
        Long postId = 1L;
        User owner = new User("user", "password", Role.USER);
        owner.setLoginId("user"); // SecurityContext principal name과 일치
        Post existingPost = new Post("기존 제목", "user", "기존 내용");
        existingPost.setUser(owner);
        Post updateData = new Post("수정된 제목", "수정된 작성자", "수정된 내용");

        given(postRepository.findById(postId)).willReturn(Optional.of(existingPost));
        given(userRepository.findByLoginId("user")).willReturn(Optional.of(owner));

        // when
        Post updatedPost = postService.updatePost(postId, updateData);

        // then
        assertEquals("수정된 제목", updatedPost.getTitle());
        assertEquals("수정된 내용", updatedPost.getContent());
        verify(postRepository).findById(postId);
    }

    @Test
    @DisplayName("게시글 삭제 - 성공")
    void deletePost_Success()
    {
        // given
        Long postId = 1L;
        User owner = new User("user", "password", Role.USER);
        owner.setLoginId("user");
        Post existingPost = new Post("테스트 제목", "user", "테스트 내용");
        existingPost.setUser(owner);

        given(postRepository.findById(postId)).willReturn(Optional.of(existingPost));
        given(userRepository.findByLoginId("user")).willReturn(Optional.of(owner));

        // when
        postService.delete(postId);

        // then
        verify(postRepository).deleteById(postId);
        verify(events).publishEvent(GraphChangedEvent.note(postId));
    }
}
