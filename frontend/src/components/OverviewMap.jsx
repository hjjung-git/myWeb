import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionHead from './SectionHead.jsx'
import { apiGet } from '../lib/api.js'
import { SKILL_GROUPS } from '../lib/skillsData.js'
import { fetchProjectsWithTech, postsAbout, projectsUsing, splitTech } from '../lib/portfolioApi.js'

// 포트폴리오 한눈에 보기 — 기술 그룹 ─ 경력·프로젝트 ─ Archive 분류가 어떻게 이어지는지 보여주는 정적 다이어그램.
// 움직이지 않고(호버 효과만), 데이터는 이미 있는 연결을 쓴다(Skills 관계 보기와 같은 규칙).
//  · 기술 그룹 ─ 프로젝트: 프로젝트 기술 스택에 그 그룹의 기술이 있을 때
//  · 프로젝트·경력 ─ 분류: 그 분류의 글이 '관련 프로젝트'로 그 항목을 골랐을 때
//  · 기술 그룹 ─ 분류: 그 분류의 글이 그 그룹의 기술과 이어졌을 때(관련 기술 또는 제목·분류 이름 일치)
const W = 1100
const ROW = 76
const TOP = 64
const NODE_H = 50
const COLS = {
  skill: { x: 16, w: 280, label: 'SKILLS' },
  item: { x: 410, w: 280, label: 'CAREER · PROJECTS' },
  cat: { x: 804, w: 280, label: 'ARCHIVE' },
}
const MAX_CATS = 8

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1)}…` : text)

function OverviewMap() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    Promise.all([
      fetchProjectsWithTech().catch(() => []),
      apiGet('/api/portfolio-items?type=EXPERIENCE').catch(() => []),
      apiGet('/api/posts/index').catch(() => []),
    ]).then(([projects, experience, posts]) => setData({ projects, experience, posts }))
  }, [])

  const model = useMemo(() => {
    if (!data) return null
    const { projects, experience, posts } = data
    const items = [
      ...experience.map((e) => ({ id: String(e.id), title: e.title, kind: 'CAREER' })),
      ...projects.map((p) => ({ id: String(p.id), title: p.title, kind: 'PROJECT', tech: p })),
    ]
    // 분류(대분류)별 글 묶음 — 글 수 많은 순
    const catMap = new Map()
    posts.forEach((post) => {
      const name = post.category || '미분류'
      if (!catMap.has(name)) catMap.set(name, [])
      catMap.get(name).push(post)
    })
    const allCats = [...catMap.entries()].sort((a, b) => b[1].length - a[1].length)
    const cats = allCats.slice(0, MAX_CATS).map(([name, list]) => ({ id: name, name, posts: list }))
    const hiddenCats = allCats.length - cats.length

    const groups = SKILL_GROUPS.map((g) => ({ id: g.name, name: g.name, tags: g.tags }))
    const edges = []
    groups.forEach((g) =>
      items.forEach((it) => {
        if (it.tech && g.tags.some((tag) => projectsUsing(tag, [it.tech]).length > 0))
          edges.push({ a: ['skill', g.id], b: ['item', it.id] })
      }),
    )
    cats.forEach((c) => {
      items.forEach((it) => {
        if (c.posts.some((post) => splitTech(post.relatedProjectIds).includes(it.id)))
          edges.push({ a: ['item', it.id], b: ['cat', c.id] })
      })
      groups.forEach((g) => {
        if (g.tags.some((tag) => postsAbout(tag, c.posts).length > 0)) edges.push({ a: ['skill', g.id], b: ['cat', c.id], far: true })
      })
    })

    const rows = Math.max(groups.length, items.length, cats.length, 1)
    const height = TOP + rows * ROW + 8
    const place = (list) => {
      const start = TOP + (rows * ROW - list.length * ROW) / 2
      return new Map(list.map((n, i) => [n.id, start + i * ROW + ROW / 2]))
    }
    return {
      groups, items, cats, edges, hiddenCats, height,
      y: { skill: place(groups), item: place(items), cat: place(cats) },
    }
  }, [data])

  const curve = (x1, y1, x2, y2) => {
    const m = (x1 + x2) / 2
    return `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`
  }

  return (
    <section id="overview" className="portfolio-section overview-section">
      <SectionHead eyebrow="Overview" title="한눈에 보기" to="/skills" linkLabel="기술별 관계 보기 →" />
      {!model && <p className="status">불러오는 중...</p>}
      {model && (
        <figure className="overview-map">
          <div className="overview-scroll">
            <svg viewBox={`0 0 ${W} ${model.height}`} role="group" aria-label="기술, 경력·프로젝트, Archive 분류의 연결 관계">
              {Object.values(COLS).map((c) => (
                <text key={c.label} className="om-head" x={c.x + c.w / 2} y="28" textAnchor="middle">{c.label}</text>
              ))}
              <g>
                {model.edges.map((e, i) => {
                  const [ka, ida] = e.a
                  const [kb, idb] = e.b
                  return (
                    <path
                      key={i}
                      className={`om-edge${e.far ? ' om-edge-far' : ''}`}
                      d={curve(COLS[ka].x + COLS[ka].w, model.y[ka].get(ida), COLS[kb].x, model.y[kb].get(idb))}
                    />
                  )
                })}
              </g>
              {model.groups.map((g) => (
                <g key={g.id} className="om-node om-skill" tabIndex={0} role="link" onClick={() => navigate('/skills')} onKeyDown={(ev) => ev.key === 'Enter' && navigate('/skills')}>
                  <rect x={COLS.skill.x} y={model.y.skill.get(g.id) - NODE_H / 2} width={COLS.skill.w} height={NODE_H} rx={NODE_H / 2} />
                  <text x={COLS.skill.x + COLS.skill.w / 2} y={model.y.skill.get(g.id) + 5.5} textAnchor="middle">{clip(g.name, 26)}</text>
                </g>
              ))}
              {model.items.map((it) => (
                <g key={it.id} className={`om-node om-item om-${it.kind.toLowerCase()}`} tabIndex={0} role="link" onClick={() => navigate(`/portfolio/${it.id}`)} onKeyDown={(ev) => ev.key === 'Enter' && navigate(`/portfolio/${it.id}`)}>
                  <title>{it.title}</title>
                  <rect x={COLS.item.x} y={model.y.item.get(it.id) - NODE_H / 2} width={COLS.item.w} height={NODE_H} rx="11" />
                  <text x={COLS.item.x + COLS.item.w / 2} y={model.y.item.get(it.id) + 5.5} textAnchor="middle">{clip(it.title, 28)}</text>
                </g>
              ))}
              {model.cats.map((c) => (
                <g key={c.id} className="om-node om-cat" tabIndex={0} role="link" onClick={() => navigate('/archive')} onKeyDown={(ev) => ev.key === 'Enter' && navigate('/archive')}>
                  <rect x={COLS.cat.x} y={model.y.cat.get(c.id) - NODE_H / 2} width={COLS.cat.w} height={NODE_H} rx="9" />
                  <text x={COLS.cat.x + 20} y={model.y.cat.get(c.id) + 5.5}>{clip(c.name, 18)}</text>
                  <text className="om-count" x={COLS.cat.x + COLS.cat.w - 20} y={model.y.cat.get(c.id) + 5.5} textAnchor="end">{c.posts.length}</text>
                </g>
              ))}
            </svg>
          </div>
          <figcaption>
            선은 실제 연결입니다 — 프로젝트의 기술 스택, 그리고 Archive 글 작성 때 고른 '관련 기술·프로젝트'.
            {model.hiddenCats > 0 && ` (글이 많은 분류 ${MAX_CATS}개만 표시)`}
          </figcaption>
        </figure>
      )}
    </section>
  )
}

export default OverviewMap
