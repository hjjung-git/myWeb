package com.example.my_server.repository;

import com.example.my_server.domain.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostImageRepository extends JpaRepository<PostImage, Long>
{
}
