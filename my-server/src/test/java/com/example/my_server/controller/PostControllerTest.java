package com.example.my_server.controller;

import com.example.my_server.config.SecurityConfig;
import com.example.my_server.domain.Post;
import com.example.my_server.exception.UnauthorizedException;
import com.example.my_server.security.LoginAttemptService;
import com.example.my_server.service.PostService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PostController.class)
@Import(SecurityConfig.class)
class PostControllerTest
{
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PostService postService;

    @MockitoBean
    private LoginAttemptService loginAttemptService;

    // ──────────────────────────────────────────────
    // 1. 비로그인 접근 차단
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("비로그인 - 수정 폼 접근 시 403")
    void editForm_NotAuthenticated_Returns403() throws Exception
    {
        mockMvc.perform(get("/post/edit/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("비로그인 - 삭제 요청 시 403")
    void delete_NotAuthenticated_Returns403() throws Exception
    {
        mockMvc.perform(get("/post/delete/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("비로그인 - 글쓰기 폼 접근 시 403")
    void writeForm_NotAuthenticated_Returns403() throws Exception
    {
        mockMvc.perform(get("/post/write/form"))
                .andExpect(status().isForbidden());
    }

    // ──────────────────────────────────────────────
    // 2. 로그인 후 정상 접근
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("로그인 - 수정 폼 접근 성공")
    void editForm_Authenticated_ReturnsEditPage() throws Exception
    {
        Post post = new Post("제목", "testUser", "내용");
        post.setId(1L);
        given(postService.findById(1L)).willReturn(post);

        mockMvc.perform(get("/post/edit/1").with(user("testUser").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(view().name("edit"));
    }

    // ──────────────────────────────────────────────
    // 3. 권한 없는 수정/삭제 → 403
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("타인 글 수정 시도 - 403 반환")
    void update_NotOwner_Returns403() throws Exception
    {
        doThrow(new UnauthorizedException("권한 없음"))
                .when(postService).updatePost(anyLong(), any(), any());

        mockMvc.perform(multipart("/post/update/1")
                        .file("file", new byte[0])
                        .param("title", "수정 제목")
                        .param("content", "수정 내용")
                        .param("username", "otherUser")
                        .with(user("otherUser").roles("USER"))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("타인 글 삭제 시도 - 403 반환")
    void delete_NotOwner_Returns403() throws Exception
    {
        doThrow(new UnauthorizedException("권한 없음"))
                .when(postService).delete(anyLong());

        mockMvc.perform(get("/post/delete/1").with(user("otherUser").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN - 타인 글 삭제 가능")
    void delete_Admin_Success() throws Exception
    {
        mockMvc.perform(get("/post/delete/1").with(user("adminUser").roles("ADMIN")))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/main/list"));
    }
}
