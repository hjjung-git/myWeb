import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { splitTech } from '../lib/portfolioApi.js'

// 기술 ↔ 프로젝트 ↔ Archive 글의 관계를 보여주는 그림 (Skills 화면의 "관계 보기").
// 새 데이터를 만들지 않고 이미 있는 연결을 쓴다:
//  · 기술 ─ 프로젝트: 프로젝트의 기술 스택 태그와 기술 이름이 같을 때
//  · 기술 ─ 글: 글 작성 화면에서 고른 '관련 기술', 또는 글 제목·분류에 기술 이름이 들어 있을 때
//  · 프로젝트 ─ 글: 글 작성 화면에서 고른 '관련 프로젝트'
const W = 900
const ROW = 38
const TOP = 46
const COLS = {
  skill: { x: 16, w: 214, label: '기술' },
  project: { x: 344, w: 250, label: '프로젝트' },
  post: { x: 704, w: 180, label: 'Archive 글' },
}
const MAX_POSTS = 14

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1)}…` : text)
const same = (a, b) => a && b && a.kind === b.kind && a.id === b.id

function RelationGraph({ groups, usage, postUsage, projects: allProjects = [], posts: allPosts = [], selected, onSelect }) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(null) // { kind, id }

  const model = useMemo(() => {
    const skills = []
    const seen = new Set() // 같은 이름이 두 그룹에 있어도(예: Cypher) 한 번만
    groups.forEach((g) =>
      g.tags.forEach((tag) => {
        if (seen.has(tag)) return
        seen.add(tag)
        const projects = usage.get(tag) ?? []
        const posts = postUsage.get(tag) ?? []
        if (projects.length || posts.length) skills.push({ id: tag, projects, posts })
      }),
    )
    // 글이 직접 가리키는 프로젝트도 보여준다(기술로는 안 이어져 있어도)
    const projectMap = new Map()
    skills.forEach((s) => s.projects.forEach((p) => projectMap.set(String(p.id), p)))
    const byId = new Map(allProjects.map((p) => [String(p.id), p]))
    allPosts.forEach((post) =>
      splitTech(post.relatedProjectIds).forEach((pid) => byId.has(pid) && projectMap.set(pid, byId.get(pid))),
    )
    const postMap = new Map()
    skills.forEach((s) => s.posts.forEach((p) => postMap.set(p.id, p)))
    allPosts.forEach((post) => {
      if (splitTech(post.relatedProjectIds).some((pid) => projectMap.has(pid))) postMap.set(post.id, post)
    })

    const posts = [...postMap.values()].sort((a, b) => b.id - a.id).slice(0, MAX_POSTS)
    const postIds = new Set(posts.map((p) => p.id))
    const projects = [...projectMap.values()]
    const rows = Math.max(skills.length, projects.length, posts.length, 1)
    const height = TOP + rows * ROW + 12
    const place = (list) => {
      const start = TOP + (rows * ROW - list.length * ROW) / 2
      return new Map(list.map((n, i) => [String(n.id), start + i * ROW + ROW / 2]))
    }
    const skillY = place(skills)
    const projectY = place(projects)
    const postY = place(posts)

    // 모든 선: a(왼쪽 노드) ─ b(오른쪽 노드)
    const edges = []
    skills.forEach((s) => {
      s.projects.forEach((p) =>
        edges.push({ a: { kind: 'skill', id: s.id }, b: { kind: 'project', id: String(p.id) }, y1: skillY.get(s.id), y2: projectY.get(String(p.id)), x1: COLS.skill.x + COLS.skill.w, x2: COLS.project.x }),
      )
      s.posts.forEach((p) => {
        if (postIds.has(p.id))
          edges.push({ a: { kind: 'skill', id: s.id }, b: { kind: 'post', id: String(p.id) }, y1: skillY.get(s.id), y2: postY.get(String(p.id)), x1: COLS.skill.x + COLS.skill.w, x2: COLS.post.x })
      })
    })
    posts.forEach((post) =>
      splitTech(post.relatedProjectIds).forEach((pid) => {
        if (projectMap.has(pid))
          edges.push({ a: { kind: 'project', id: pid }, b: { kind: 'post', id: String(post.id) }, y1: projectY.get(pid), y2: postY.get(String(post.id)), x1: COLS.project.x + COLS.project.w, x2: COLS.post.x, pp: true })
      }),
    )
    return { skills, projects, posts, edges, skillY, projectY, postY, height, hiddenPosts: postMap.size - posts.length }
  }, [groups, usage, postUsage, allProjects, allPosts])

  // 지금 강조할 대상: 올려둔(hover) 것이 우선, 없으면 눌러서 고른 기술
  const focus = hover ?? (selected ? { kind: 'skill', id: selected } : null)
  const lit = (e) => {
    if (!focus) return true
    if (same(e.a, focus) || same(e.b, focus)) return true
    // 기술에 포커스가 있으면, 그 기술과 이어진 프로젝트에서 글로 가는 선도 함께 켠다
    if (focus.kind === 'skill' && e.pp)
      return model.edges.some((x) => !x.pp && x.a.id === focus.id && x.b.kind === 'project' && x.b.id === e.a.id)
    return false
  }
  const litNode = (kind, id) => {
    if (!focus) return true
    if (focus.kind === kind && focus.id === id) return true
    return model.edges.some((e) => lit(e) && (same(e.a, { kind, id }) || same(e.b, { kind, id })))
  }

  if (model.skills.length === 0) return <p className="status">아직 연결된 항목이 없습니다.</p>

  const curve = (x1, y1, x2, y2) => {
    const m = (x1 + x2) / 2
    return `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`
  }
  const nodeProps = (kind, id, onActivate) => ({
    className: `rg-node rg-${kind}${same(focus, { kind, id }) ? ' is-focus' : ''}${litNode(kind, id) ? '' : ' is-dim'}`,
    tabIndex: 0,
    role: 'button',
    onMouseEnter: () => setHover({ kind, id }),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover({ kind, id }),
    onBlur: () => setHover(null),
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onActivate()
      }
    },
  })

  return (
    <figure className="rel-graph">
      <svg viewBox={`0 0 ${W} ${model.height}`} role="group" aria-label="기술, 프로젝트, Archive 글의 연결 관계">
        {Object.entries(COLS).map(([k, c]) => (
          <text key={k} className="rg-head" x={c.x + c.w / 2} y="22" textAnchor="middle">{c.label}</text>
        ))}
        <g className="rg-edges">
          {model.edges.map((e, i) => (
            <path
              key={i}
              className={`rg-edge${e.pp ? ' rg-edge-pp' : ''}${lit(e) ? (focus ? ' is-lit' : '') : ' is-dim'}`}
              d={curve(e.x1, e.y1, e.x2, e.y2)}
            />
          ))}
        </g>
        {model.skills.map((s) => (
          <g key={s.id} {...nodeProps('skill', s.id, () => onSelect(selected === s.id ? null : s.id))} aria-pressed={selected === s.id}>
            <rect x={COLS.skill.x} y={model.skillY.get(s.id) - 14} width={COLS.skill.w} height="28" rx="14" />
            <text x={COLS.skill.x + COLS.skill.w / 2} y={model.skillY.get(s.id) + 4.5} textAnchor="middle">{clip(s.id, 22)}</text>
          </g>
        ))}
        {model.projects.map((p) => {
          const id = String(p.id)
          return (
            <g key={id} {...nodeProps('project', id, () => navigate(`/portfolio/${p.id}`))}>
              <title>{p.title}</title>
              <rect x={COLS.project.x} y={model.projectY.get(id) - 14} width={COLS.project.w} height="28" rx="8" />
              <text x={COLS.project.x + COLS.project.w / 2} y={model.projectY.get(id) + 4.5} textAnchor="middle">{clip(p.title, 24)}</text>
            </g>
          )
        })}
        {model.posts.map((p) => {
          const id = String(p.id)
          return (
            <g key={id} {...nodeProps('post', id, () => navigate(`/archive/${p.id}`))}>
              <title>{p.title}</title>
              <rect x={COLS.post.x} y={model.postY.get(id) - 14} width={COLS.post.w} height="28" rx="8" />
              <text x={COLS.post.x + COLS.post.w / 2} y={model.postY.get(id) + 4.5} textAnchor="middle">{clip(p.title, 18)}</text>
            </g>
          )
        })}
      </svg>
      <figcaption>
        기술을 누르면 연결된 프로젝트·글이 강조되고, 프로젝트나 글을 누르면 그 페이지로 갑니다.
        {model.hiddenPosts > 0 && ` (최근 글 ${MAX_POSTS}개만 표시, 나머지 ${model.hiddenPosts}개 생략)`}
      </figcaption>
    </figure>
  )
}

export default RelationGraph
