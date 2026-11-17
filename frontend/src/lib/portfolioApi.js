import { apiGet } from './api.js'

// "Java, Spring Boot, MySQL" → ['Java', 'Spring Boot', 'MySQL']
export function splitTech(text) {
  return text ? text.split(',').map((t) => t.trim()).filter(Boolean) : []
}

// 프로젝트 목록(요약)에는 기술 스택이 없어서, 기술 스택이 필요한 화면(Skills·프로젝트 전체 페이지)은
// 항목별 상세를 한 번씩 더 받아 붙인다. 프로젝트는 몇 개 안 되니 이 정도면 충분하다.
export async function fetchProjectsWithTech() {
  const list = await apiGet('/api/portfolio-items?type=PROJECT')
  return Promise.all(
    list.map(async (project) => {
      try {
        const detail = await apiGet(`/api/portfolio-items/${project.id}`)
        return { ...project, techStack: detail.techStack ?? '' }
      } catch {
        return { ...project, techStack: '' }
      }
    }),
  )
}

// 기술 이름 비교용 — 괄호 설명은 버리고 단어 단위로 쪼갠다. ("RDF/OWL (학습중)" → rdf, owl)
function tokens(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .split(/[^a-z0-9가-힣+#]+/)
      .filter(Boolean),
  )
}

const isSubset = (a, b) => [...a].every((t) => b.has(t))

// 두 기술 이름이 같은 기술을 가리키는지. 한쪽 단어가 다른 쪽에 통째로 들어 있으면 같다고 본다.
//  "MySQL" ↔ "AWS RDS MySQL" → 같음 / "Java" ↔ "JavaScript" → 다름 (단어가 다르므로)
export function sameTech(a, b) {
  const ta = tokens(a)
  const tb = tokens(b)
  if (ta.size === 0 || tb.size === 0) return false
  return isSubset(ta, tb) || isSubset(tb, ta)
}

// 이 기술을 쓴 프로젝트들
export function projectsUsing(skill, projects) {
  return projects.filter((project) => splitTech(project.techStack).some((tech) => sameTech(skill, tech)))
}

// 이 기술과 이어진 Archive 글들 — ① 글 작성 화면에서 직접 고른 '관련 기술' 또는 ② 제목·분류(대분류›중분류›소분류)에 기술 이름이 들어 있으면 자동 연결
export function postsAbout(skill, posts) {
  const need = tokens(skill)
  if (need.size === 0) return []
  return posts.filter((post) => {
    if (splitTech(post.relatedSkills).some((name) => sameTech(skill, name))) return true
    const text = [post.title, post.category, post.subcategory, post.minorCategory].filter(Boolean).join(' ')
    return isSubset(need, tokens(text))
  })
}

// 글 작성 화면에서 이 프로젝트(또는 경력)를 '관련 프로젝트'로 고른 Archive 글들
export function postsForProject(projectId, posts) {
  const key = String(projectId)
  return posts.filter((post) => splitTech(post.relatedProjectIds).includes(key))
}

// 글 쓰기에서 고를 수 있는 프로젝트·경력 목록 (id → 제목)
export async function fetchPortfolioChoices() {
  const [projects, experience] = await Promise.all([
    apiGet('/api/portfolio-items?type=PROJECT'),
    apiGet('/api/portfolio-items?type=EXPERIENCE'),
  ])
  return [
    ...projects.map((p) => ({ id: String(p.id), title: p.title, kind: '프로젝트' })),
    ...experience.map((p) => ({ id: String(p.id), title: p.title, kind: '경력' })),
  ]
}
