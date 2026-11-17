package com.example.my_server.dto;

import com.example.my_server.domain.SkillLevel;

public record SkillLevelResponse(String name, int level, boolean featured)
{
    public static SkillLevelResponse from(SkillLevel skill)
    {
        return new SkillLevelResponse(skill.getName(), skill.getLevel(), skill.isFeatured());
    }
}
