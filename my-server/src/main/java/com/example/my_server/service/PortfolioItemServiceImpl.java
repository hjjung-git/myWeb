package com.example.my_server.service;

import com.example.my_server.domain.PortfolioItem;
import com.example.my_server.domain.PortfolioItemType;
import com.example.my_server.exception.PostNotFoundException;
import com.example.my_server.repository.PortfolioItemRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PortfolioItemServiceImpl implements PortfolioItemService
{
    private final PortfolioItemRepository portfolioItemRepository;

    public PortfolioItemServiceImpl(PortfolioItemRepository portfolioItemRepository)
    {
        this.portfolioItemRepository = portfolioItemRepository;
    }

    @Override
    public List<PortfolioItem> list(PortfolioItemType type)
    {
        Sort sort = Sort.by(Sort.Direction.ASC, "displayOrder");
        return type != null
                ? portfolioItemRepository.findByType(type, sort)
                : portfolioItemRepository.findAll(sort);
    }

    @Override
    public PortfolioItem findById(Long id)
    {
        // 별도의 PortfolioItemNotFoundException을 새로 만드는 대신 기존 예외를 재사용
        // (둘 다 "해당 항목을 못 찾음"이라는 같은 의미라 ApiExceptionHandler에서 404로 처리됨)
        return portfolioItemRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("해당 포트폴리오 항목을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public PortfolioItem create(PortfolioItem item)
    {
        return portfolioItemRepository.save(item);
    }

    @Override
    @Transactional
    public PortfolioItem update(Long id, PortfolioItem updated)
    {
        PortfolioItem existing = findById(id);

        existing.setType(updated.getType());
        existing.setTitle(updated.getTitle());
        existing.setSummary(updated.getSummary());
        existing.setDetailContent(updated.getDetailContent());
        existing.setPeriodText(updated.getPeriodText());
        existing.setTechStack(updated.getTechStack());
        existing.setLinkUrl(updated.getLinkUrl());
        existing.setThumbnailPath(updated.getThumbnailPath());
        existing.setDisplayOrder(updated.getDisplayOrder());

        return existing;
    }

    @Override
    @Transactional
    public void delete(Long id)
    {
        findById(id);
        portfolioItemRepository.deleteById(id);
    }
}
