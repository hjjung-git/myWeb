package com.example.my_server.service;

import com.example.my_server.domain.PostImage;
import org.springframework.web.multipart.MultipartFile;

public interface PostImageService
{
    PostImage store(MultipartFile file);
    PostImage findById(Long id);
}
