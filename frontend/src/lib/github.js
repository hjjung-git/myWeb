// GitHub 저장소의 언어 비율(GitHub "Languages" 막대와 같은 값)을 브라우저에서 바로 가져온다.
// 프로젝트의 링크(linkUrl)가 https://github.com/<owner>/<repo> 형태일 때만 동작하고, 공개 저장소만 된다.
// GitHub API는 방문자 IP당 시간당 60회로 제한되어서, 한 번 받은 결과는 메모리와 sessionStorage(1시간)에 캐시한다.

// 자주 쓰는 언어의 GitHub 대표 색 — 없으면 이름으로 색을 만든다.
const COLORS = {
  Java: '#b07219', JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', HTML: '#e34c26',
  CSS: '#7a5cc7', SCSS: '#c6538c', Shell: '#89e051', SQL: '#e38c00', 'C++': '#f34b7d', C: '#6e6e6e',
  Kotlin: '#A97BFF', Go: '#00ADD8', Rust: '#dea584', Cypher: '#2f8f83', Dockerfile: '#384d54',
  Jupyter: '#DA5B0B', 'Jupyter Notebook': '#DA5B0B', Makefile: '#427819', PLpgSQL: '#336790',
}

export function languageColor(name) {
  if (COLORS[name]) return COLORS[name]
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return `hsl(${h} 55% 52%)`
}

// "https://github.com/owner/repo(.git)(/…)" → { owner, repo }, 아니면 null
export function parseRepo(url) {
  const m = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/i.exec(url || '')
  if (!m) return null
  return { owner: m[1], repo: m[2].replace(/\.git$/i, '') }
}

const memory = new Map()
const TTL = 60 * 60 * 1000

// 비율 배열 [{ name, pct, color }] (큰 순서). 실패하거나 저장소가 아니면 null.
export async function fetchLanguages(url) {
  const repo = parseRepo(url)
  if (!repo) return null
  const key = `gh-lang:${repo.owner}/${repo.repo}`
  if (memory.has(key)) return memory.get(key)
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (cached && Date.now() - cached.at < TTL) {
      memory.set(key, cached.data)
      return cached.data
    }
  } catch { /* 저장소를 못 써도 괜찮다 */ }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/languages`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const bytes = await res.json()
    const total = Object.values(bytes).reduce((a, b) => a + b, 0)
    if (!total) return null
    const data = Object.entries(bytes)
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({ name, pct: (n / total) * 100, color: languageColor(name) }))
    memory.set(key, data)
    try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })) } catch { /* 무시 */ }
    return data
  } catch {
    return null
  }
}
