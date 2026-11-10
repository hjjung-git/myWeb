package com.example.my_server.repository;

import com.example.my_server.domain.Education;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Long>
{
    List<Education> findAllByOrderByDisplayOrderAsc();
}
