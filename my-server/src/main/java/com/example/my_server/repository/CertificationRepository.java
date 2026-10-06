package com.example.my_server.repository;

import com.example.my_server.domain.Certification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CertificationRepository extends JpaRepository<Certification, Long>
{
    List<Certification> findAllByOrderByDisplayOrderAsc();
}
