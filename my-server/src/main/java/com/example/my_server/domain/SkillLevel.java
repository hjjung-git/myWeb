package com.example.my_server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * 기술 하나에 대한 "내 숙련도"(0~100)와 홈의 핵심 기술로 보일지 여부.
 * 기술 이름은 프런트의 기술 목록(skillsData.js)과 같은 문자열이다.
 */
@Entity
@Table(name = "skill_levels")
public class SkillLevel
{
    @Id
    @Column(length = 100)
    private String name;

    @Column(nullable = false)
    private int level;

    @Column(nullable = false)
    private boolean featured;

    public SkillLevel() {}

    public SkillLevel(String name, int level, boolean featured)
    {
        this.name = name;
        this.level = level;
        this.featured = featured;
    }

    public String getName() { return name; }
    public int getLevel() { return level; }
    public boolean isFeatured() { return featured; }
    public void setLevel(int level) { this.level = level; }
    public void setFeatured(boolean featured) { this.featured = featured; }
}
