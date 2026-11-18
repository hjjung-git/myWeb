import { sameTech, splitTech } from './portfolioApi.js'

// 코드 글을 쓸 때 고르기 쉽게 자주 쓰는 언어 — 목록에 없는 언어도 직접 적을 수 있다.
export const COMMON_LANGUAGES = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'SQL', 'Cypher', 'Shell', 'C', 'C++', 'HTML', 'CSS', 'Kotlin', 'Go',
]

// 언어 안에서 글을 묶는 '용도' — 목록 소제목 순서이기도 하다. 목록에 없는 용도도 직접 적을 수 있고 뒤에 붙는다.
export const CODE_CATEGORIES = ['재사용 알고리즘', '효율적인 코드', '짧은 표현']
export const NO_CATEGORY = '기타'

// [{ language, items, groups: [{ category, items }] }] — 언어는 글 수 많은 순, 용도는 CODE_CATEGORIES 순서 → 나머지 → 기타
export function groupByLanguage(snippets) {
  const byLang = new Map()
  for (const s of snippets) {
    if (!byLang.has(s.language)) byLang.set(s.language, [])
    byLang.get(s.language).push(s)
  }
  const rank = (c) => {
    if (c === NO_CATEGORY) return 1000
    const i = CODE_CATEGORIES.indexOf(c)
    return i === -1 ? 100 : i
  }
  return [...byLang.entries()]
    .map(([language, items]) => {
      const byCat = new Map()
      for (const s of items) {
        const c = s.category || NO_CATEGORY
        if (!byCat.has(c)) byCat.set(c, [])
        byCat.get(c).push(s)
      }
      const groups = [...byCat.entries()]
        .map(([category, list]) => ({ category, items: list }))
        .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category, 'ko'))
      return { language, items, groups }
    })
    .sort((a, b) => b.items.length - a.items.length || a.language.localeCompare(b.language))
}

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
