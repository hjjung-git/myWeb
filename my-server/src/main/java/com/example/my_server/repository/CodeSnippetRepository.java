package com.example.my_server.repository;

import com.example.my_server.domain.CodeSnippet;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodeSnippetRepository extends JpaRepository<CodeSnippet, Long>
{
}
