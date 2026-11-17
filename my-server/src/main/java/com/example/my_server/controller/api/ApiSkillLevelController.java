package com.example.my_server.controller.api;

import com.example.my_server.domain.SkillLevel;
import com.example.my_server.dto.SkillLevelRequest;
import com.example.my_server.dto.SkillLevelResponse;
import com.example.my_server.repository.SkillLevelRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 기술별 "내 숙련도"(0~100)와 핵심 기술 여부.
 * 조회(GET)는 누구나, 저장(PUT)은 관리자 모드에서만 (SecurityConfig 참고).
 * PUT은 보낸 항목만 만들거나 덮어쓴다(없는 항목은 그대로 둔다).
 */
@RestController
@RequestMapping("/api/skill-levels")
public class ApiSkillLevelController {

    private final SkillLevelRepository skillLevelRepository;

    public ApiSkillLevelController(SkillLevelRepository skillLevelRepository) {
        this.skillLevelRepository = skillLevelRepository;
    }

    @GetMapping
    public List<SkillLevelResponse> list() {
        return skillLevelRepository.findAll().stream().map(SkillLevelResponse::from).toList();
    }

    @PutMapping
    public List<SkillLevelResponse> save(@RequestBody List<SkillLevelRequest> requests) {
        List<SkillLevel> toSave = requests.stream()
                .filter(r -> r.name() != null && !r.name().isBlank() && r.name().trim().length() <= 100)
                .map(r -> new SkillLevel(r.name().trim(), Math.max(0, Math.min(100, r.level())), r.featured()))
                .toList();
        skillLevelRepository.saveAll(toSave);
        return list();
    }
}
