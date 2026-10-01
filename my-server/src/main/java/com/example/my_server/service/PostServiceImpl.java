package com.example.my_server.service;

import com.example.my_server.domain.Post;
import com.example.my_server.domain.Role;
import com.example.my_server.domain.User;
import com.example.my_server.exception.PostNotFoundException;
import com.example.my_server.exception.UnauthorizedException;
import com.example.my_server.repository.PostRepository;
import com.example.my_server.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService
{
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostServiceImpl(PostRepository postRepository, UserRepository userRepository)
    {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Page<Post> list(String keyword, Pageable pageable) {
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();

        return hasKeyword
                ? postRepository.findByTitleContainingOrContentContaining(keyword, keyword, pageable)
                : postRepository.findAll(pageable);
    }

    // ID로 포스트 찾기
    @Override
    public Post findById(Long id)
    {
        return postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("해당 포스트를 찾을 수 없습니다."));
    }

    // 포스트 저장하기
    @Override
    @Transactional
    public Long save(Post post)
    {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        String username;
        if (principal instanceof UserDetails)
        { username = ((UserDetails) principal).getUsername(); }
        else if (principal instanceof String)
        { username = (String) principal; }
        else
        { throw new RuntimeException("로그인 정보를 찾을 수 없습니다."); }

        User user = userRepository.findByLoginId(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        post.setUser(user);
        post.setUsername(user.getNickname());

        return postRepository.save(post).getId();
    }

    // 현재 로그인한 사용자의 loginId 반환
    private String getCurrentLoginId()
    {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails)
            return ((UserDetails) principal).getUsername();
        else if (principal instanceof String)
            return (String) principal;

        throw new RuntimeException("로그인 정보를 찾을 수 없습니다.");
    }

    // 현재 로그인한 사용자가 해당 게시글의 작성자인지 검증
    private void validateOwner(Post post)
    {
        String currentLoginId = getCurrentLoginId();
        User currentUser = userRepository.findByLoginId(currentLoginId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = post.getUser() != null &&
                          post.getUser().getLoginId().equals(currentLoginId);

        if (!isAdmin && !isOwner)
            throw new UnauthorizedException("본인이 작성한 게시글만 수정/삭제할 수 있습니다.");
    }

    // 포스트 수정하기
    @Override
    @Transactional
    public Post updatePost(Long id, Post updatedPost)
    {
        Post existingPost = findById(id);
        validateOwner(existingPost);

        existingPost.setTitle(updatedPost.getTitle());
        existingPost.setContent(updatedPost.getContent());

        return existingPost;
    }

    // 포스트 삭제하기
    @Override
    @Transactional
    public void delete(Long id)
    {
        Post post = findById(id);
        validateOwner(post);
        postRepository.deleteById(id);
    }
}
