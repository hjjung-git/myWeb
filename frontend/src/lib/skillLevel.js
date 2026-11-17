import { postsAbout, projectsUsing } from './portfolioApi.js'
import { snippetsAbout } from './codebase.js'

// 기술 막대(레벨) — 두 가지를 함께 보여준다.
//  · 채워진 부분(evidence, 적응형): Archive 글·Codebase 코드·프로젝트가 쌓일수록 저절로 올라간다. 기록으로 증명된 진척도.
//  · 눈금(self): 관리자가 직접 정한 "내가 생각하는 숙련도". 채움이 눈금을 따라잡는 모습이 곧 성장이다.
// 점수는 항목마다 다르게 가중하고, 수확 체감(지수)으로 100에 가까워질수록 천천히 오르게 했다.
const POINTS = { post: 7, snippet: 9, project: 14 }
const SCALE = 45

export function evidencePercent({ posts, snippets, projects }) {
  const pts = posts * POINTS.post + snippets * POINTS.snippet + projects * POINTS.project
  return Math.round(100 * (1 - Math.exp(-pts / SCALE)))
}

// 기술 그룹의 모든 기술(중복 이름 제거)에 대해 { name, counts, evidence, self, featured } 한 줄씩
export function buildSkillRows(groups, { projects, posts, snippets, levels }) {
  const names = [...new Set(groups.flatMap((g) => g.tags))]
  return names.map((name) => {
    const counts = {
      projects: projectsUsing(name, projects).length,
      posts: postsAbout(name, posts).length,
      snippets: snippetsAbout(name, snippets).length,
    }
    const saved = levels.get(name)
    return { name, counts, evidence: evidencePercent(counts), self: saved?.level ?? 0, featured: saved?.featured ?? false }
  })
}

const shown = (r) => Math.max(r.self, r.evidence)

// 홈에 보일 핵심 기술 — 관리자가 고른 것이 있으면 그것, 없으면 기록·숙련도가 높은 순 상위 N개
export function pickCore(rows, max = 8) {
  const featured = rows.filter((r) => r.featured)
  const base = featured.length > 0 ? featured : rows.filter((r) => r.evidence > 0 || r.self > 0).slice()
  return base.sort((a, b) => shown(b) - shown(a)).slice(0, featured.length > 0 ? 24 : max)
}
