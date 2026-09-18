package com.example.my_server.repository;

import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.PortfolioItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, Long>
{
    List<PortfolioItem> findByType(PortfolioItemType type, Sort sort);
}
