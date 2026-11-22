import { pathOf } from './archiveTree.js'
import { languagesOf } from './codebase.js'

// Archive 첫 화면의 통합 검색 — 지식(Archive 글)과 코드(Codebase)를 한 번에 찾는다.
// 띄어쓰기로 나눈 검색어가 모두 들어 있어야 맞는다(AND). 대소문자는 구분하지 않는다.
// 순위: 제목이 첫 검색어로 시작 > 제목에 검색어가 모두 있음 > 나머지(분류·설명·언어·기술)까지 합쳐야 있음.
// 순위가 같으면 원래 목록 순서를 지킨다. (본문 내용 검색은 다음 단계 — RAG용 검색 API에서)
export const searchTerms = (query) => query.trim().toLowerCase().split(/\s+/).filter(Boolean)

export const postText = (p) => `${pathOf(p).join(' ')} ${p.relatedSkills ?? ''}`
export const snippetText = (s) =>
  `${s.description ?? ''} ${s.category ?? ''} ${languagesOf(s).join(' ')} ${s.relatedSkills ?? ''}`

function rankOf(title, rest, terms) {
  const t = (title ?? '').toLowerCase()
  const all = `${t} ${rest.toLowerCase()}`
  if (!terms.every((w) => all.includes(w))) return -1
  const inTitle = terms.every((w) => t.includes(w))
  if (inTitle && t.startsWith(terms[0])) return 0
  return inTitle ? 1 : 2
}

function pick(items, terms, restOf) {
  return items
    .map((item, i) => ({ item, i, r: rankOf(item.title, restOf(item), terms) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.item)
}

// { posts, snippets } — 검색어가 비면 null
export function searchAll(query, posts, snippets) {
  const terms = searchTerms(query)
  if (terms.length === 0) return null
  return {
    posts: pick(posts ?? [], terms, postText),
    snippets: pick(snippets ?? [], terms, snippetText),
  }
}

// 검색어가 언어 이름 하나와 정확히 같으면(예: "java") 그 언어 — 코드 결과를 그 언어 칸으로 바로 연다.
export function languageInQuery(query, snippet) {
  const q = query.trim().toLowerCase()
  return languagesOf(snippet).find((l) => l.toLowerCase() === q) ?? ''
}
