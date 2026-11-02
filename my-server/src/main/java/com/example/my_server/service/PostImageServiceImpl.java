package com.example.my_server.service;

import com.example.my_server.domain.PostImage;
import com.example.my_server.exception.PostNotFoundException;
import com.example.my_server.repository.PostImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class PostImageServiceImpl implements PostImageService
{
    // SVG는 안에 스크립트를 넣을 수 있어 제외한다(같은 origin에서 열리면 XSS 위험).
    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/gif", "image/webp");

    private final PostImageRepository postImageRepository;

    public PostImageServiceImpl(PostImageRepository postImageRepository)
    {
        this.postImageRepository = postImageRepository;
    }

    @Override
    @Transactional
    public PostImage store(MultipartFile file)
    {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("업로드할 이미지가 없습니다.");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType))
            throw new IllegalArgumentException("PNG, JPG, GIF, WEBP 이미지만 올릴 수 있습니다.");

        PostImage image = new PostImage();
        image.setOriginalName(file.getOriginalFilename());
        image.setContentType(contentType);
        image.setSize(file.getSize());
        try {
            image.setData(file.getBytes());
        } catch (IOException e) {
            throw new IllegalStateException("이미지를 읽지 못했습니다.", e);
        }
        return postImageRepository.save(image);
    }

    @Override
    public PostImage findById(Long id)
    {
        return postImageRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("해당 이미지를 찾을 수 없습니다."));
    }
}
