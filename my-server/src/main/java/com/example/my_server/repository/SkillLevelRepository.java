package com.example.my_server.repository;

import com.example.my_server.domain.SkillLevel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillLevelRepository extends JpaRepository<SkillLevel, String>
{
}
