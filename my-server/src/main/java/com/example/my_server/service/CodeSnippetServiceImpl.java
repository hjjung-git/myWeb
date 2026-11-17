package com.example.my_server.service;

import com.example.my_server.domain.CodeSnippet;
import com.example.my_server.exception.PostNotFoundException;
import com.example.my_server.repository.CodeSnippetRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CodeSnippetServiceImpl implements CodeSnippetService
{
    private final CodeSnippetRepository codeSnippetRepository;

    public CodeSnippetServiceImpl(CodeSnippetRepository codeSnippetRepository)
    {
        this.codeSnippetRepository = codeSnippetRepository;
    }

    @Override
    public List<CodeSnippet> list()
    {
        return codeSnippetRepository.findAll(Sort.by(Sort.Direction.DESC, "lastModifiedAt"));
    }

    @Override
    public CodeSnippet findById(Long id)
    {
        // "못 찾음"은 기존 예외를 재사용한다(ApiExceptionHandler가 404로 처리)
        return codeSnippetRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("해당 코드 글을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public CodeSnippet create(CodeSnippet snippet)
    {
        return codeSnippetRepository.save(snippet);
    }

    @Override
    @Transactional
    public CodeSnippet update(Long id, CodeSnippet updated)
    {
        CodeSnippet existing = findById(id);
        existing.setTitle(updated.getTitle());
        existing.setLanguage(updated.getLanguage());
        existing.setDescription(updated.getDescription());
        existing.setContent(updated.getContent());
        existing.setRelatedSkills(updated.getRelatedSkills());
        existing.setRelatedProjectIds(updated.getRelatedProjectIds());
        return existing;
    }

    @Override
    @Transactional
    public void delete(Long id)
    {
        findById(id);
        codeSnippetRepository.deleteById(id);
    }
}
