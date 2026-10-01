package com.example.my_server.service;

import com.example.my_server.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostService
{
    Long save(Post post);
    Page<Post> list(String keyword, Pageable pageable);
    Post findById(Long id);
    Post updatePost(Long id, Post updatedPost);
    void delete(Long id);
}
