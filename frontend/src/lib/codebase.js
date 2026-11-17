import { sameTech, splitTech } from './portfolioApi.js'

// 코드 글을 쓸 때 고르기 쉽게 자주 쓰는 언어 — 목록에 없는 언어도 직접 적을 수 있다.
export const COMMON_LANGUAGES = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'SQL', 'Cypher', 'Shell', 'C', 'C++', 'HTML', 'CSS', 'Kotlin', 'Go',
]

// 이 기술과 이어진 Codebase 글들 — ① 직접 고른 '관련 기술' ② 글의 언어가 그 기술 이름과 같을 때(예: Java)
export function snippetsAbout(skill, snippets) {
  return snippets.filter(
    (s) => sameTech(skill, s.language) || splitTech(s.relatedSkills).some((name) => sameTech(skill, name)),
  )
}

// 이 프로젝트(또는 경력)를 '관련 프로젝트'로 고른 Codebase 글들
export function snippetsForProject(projectId, snippets) {
  const key = String(projectId)
  return snippets.filter((s) => splitTech(s.relatedProjectIds).includes(key))
}
