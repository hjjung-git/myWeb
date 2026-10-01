package com.example.my_server.repository;

import com.example.my_server.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>
{
    List<Post> findAllByOrderByIdDesc();
    Page<Post> findByTitleContainingOrContentContaining(String title, String content, Pageable pageable);
}
