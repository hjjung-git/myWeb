package com.example.my_server.repository;

import com.example.my_server.domain.CodeSnippet;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeSnippetRepository extends JpaRepository<CodeSnippet, Long>
{
    // 목록·상세에서 언어별 코드를 항상 쓰므로 한 번에 가져온다
    @Override
    @EntityGraph(attributePaths = "variants")
    List<CodeSnippet> findAll(Sort sort);

    @Override
    @EntityGraph(attributePaths = "variants")
    Optional<CodeSnippet> findById(Long id);
}
