package com.example.my_server.service;

import com.example.my_server.domain.CodeSnippet;

import java.util.List;

public interface CodeSnippetService
{
    List<CodeSnippet> list();

    CodeSnippet findById(Long id);

    CodeSnippet create(CodeSnippet snippet);

    CodeSnippet update(Long id, CodeSnippet updated);

    void delete(Long id);
}
