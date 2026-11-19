import { sameTech, splitTech } from './portfolioApi.js'

// 코드 글을 쓸 때 고르기 쉽게 자주 쓰는 언어 — 목록에 없는 언어도 직접 적을 수 있다.
export const COMMON_LANGUAGES = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'SQL', 'Cypher', 'Shell', 'C', 'C++', 'HTML', 'CSS', 'Kotlin', 'Go',
]

// 글을 묶는 '용도' — 목록 소제목 순서이기도 하다. 목록에 없는 용도도 직접 적을 수 있고 뒤에 붙는다.
export const CODE_CATEGORIES = ['재사용 알고리즘', '효율적인 코드', '짧은 표현']
export const NO_CATEGORY = '기타'

// 한 글이 가진 언어들 (한 글에 여러 언어의 코드가 들어갈 수 있다)
export const languagesOf = (s) => s.languages ?? []

// 언어별 글 수 — 한 글이 두 언어를 가지면 두 언어 모두에 1씩 센다. 많은 순.
export function languageCounts(snippets) {
  const count = new Map()
  snippets.forEach((s) => languagesOf(s).forEach((l) => count.set(l, (count.get(l) ?? 0) + 1)))
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

// 용도별로 묶기: [{ category, items }] — CODE_CATEGORIES 순서 → 나머지(가나다) → 기타. 글은 한 번만 나온다.
export function groupByCategory(snippets) {
  const byCat = new Map()
  for (const s of snippets) {
    const c = s.category || NO_CATEGORY
    if (!byCat.has(c)) byCat.set(c, [])
    byCat.get(c).push(s)
  }
  const rank = (c) => {
    if (c === NO_CATEGORY) return 1000
    const i = CODE_CATEGORIES.indexOf(c)
    return i === -1 ? 100 : i
  }
  return [...byCat.entries()]
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category, 'ko'))
}

// 이 기술과 이어진 Codebase 글들 — ① 직접 고른 '관련 기술' ② 글에 그 기술 이름과 같은 언어의 코드가 있을 때(예: Java)
export function snippetsAbout(skill, snippets) {
  return snippets.filter(
    (s) => languagesOf(s).some((l) => sameTech(skill, l)) || splitTech(s.relatedSkills).some((name) => sameTech(skill, name)),
  )
}

// 이 프로젝트(또는 경력)를 '관련 프로젝트'로 고른 Codebase 글들
export function snippetsForProject(projectId, snippets) {
  const key = String(projectId)
  return snippets.filter((s) => splitTech(s.relatedProjectIds).includes(key))
}
