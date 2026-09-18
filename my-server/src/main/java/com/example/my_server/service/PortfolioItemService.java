package com.example.my_server.service;

import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.PortfolioItemType;

import java.util.List;

public interface PortfolioItemService
{
    List<PortfolioItem> list(PortfolioItemType type);
    PortfolioItem findById(Long id);
    PortfolioItem create(PortfolioItem item);
    PortfolioItem update(Long id, PortfolioItem updated);
    void delete(Long id);
}
