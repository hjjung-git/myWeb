import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { forceLayout } from '../lib/forceLayout.js'

// 지식 그래프(Neo4j)와 검색 조각(벡터)을 읽기 전용으로 살펴보는 전체 화면 창 — 수정 기능은 없다.
// 누구나 Archive 홈의 '지식 그래프 보기'로 열 수 있다(탭: 그래프 | 조각·임베딩).
// 관리자에게는 '검색 시험' 탭이 더 있다(질문 임베딩에 외부 API를 쓰므로). Esc로 닫는다.
export const LABELS = {
  Note: { name: '글', color: '#2f7d5b' },
  Code: { name: '코드', color: '#3a6fb0' },
  Skill: { name: '기술', color: '#c27c1a' },
  Project: { name: '프로젝트', color: '#9b4dca' },
  Category: { name: '분류', color: '#7a8a83' },
  Purpose: { name: '주제', color: '#b0476b' },
}
const docUrl = (node) =>
  node.label === 'Note' ? `/archive/${node.ref}` : node.label === 'Code' ? `/codebase/${node.ref}` : null

function GraphMonitor({ initialTab = 'graph', admin = false, onClose }) {
  const [tab, setTab] = useState(initialTab)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiGet('/api/graph/view').then(setData).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // body에 바로 붙인다(부모의 애니메이션 transform 영향 없이 화면 전체를 덮도록)
  return createPortal(
    <div className="gm-overlay" role="dialog" aria-modal="true" aria-label="지식 그래프">
      <div className="gm-window">
        <header className="gm-head">
          <strong>{admin ? '지식 그래프 모니터링' : '지식 그래프'}</strong>
          <nav className="gm-tabs" role="tablist">
            {[
              ['graph', '그래프'],
              ['chunks', '조각·임베딩'],
              ...(admin ? [['search', '검색 시험']] : []),
            ].map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} className={`gm-tab${tab === key ? ' is-on' : ''}`} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </nav>
          <button type="button" className="gm-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>
        <div className="gm-body">
          {error && <p className="status status-error">{error}</p>}
          {!error && !data && <p className="status">불러오는 중...</p>}
          {data && tab === 'graph' && <GraphView data={data} />}
          {data && tab === 'chunks' && <ChunkView data={data} />}
          {admin && tab === 'search' && <SearchTest />}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ---- 그래프: 힘 기반 배치, 끌어서 이동·휠로 확대, 노드를 누르면 연결 강조 + 정보 ----
function GraphView({ data }) {
  const [hidden, setHidden] = useState(() => new Set())
  const [selected, setSelected] = useState(null)
  const [hover, setHover] = useState(null)
  const [view, setView] = useState(null) // {x, y, w, h}
  const drag = useRef(null)
  const svgRef = useRef(null)
  const [svgWidth, setSvgWidth] = useState(900)

  // 화면에 그려진 폭 — 글자·선 굵기를 확대 정도와 상관없이 화면 픽셀 기준으로 맞추는 데 쓴다
  useEffect(() => {
    const el = svgRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(() => setSvgWidth(el.clientWidth || 900))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const nodes = useMemo(() => data.nodes.filter((n) => !hidden.has(n.label)), [data, hidden])
  const ids = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])
  const links = useMemo(() => data.links.filter((l) => ids.has(l.source) && ids.has(l.target)), [data, ids])
  const pos = useMemo(() => forceLayout(nodes, links), [nodes, links])
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const degree = useMemo(() => {
    const d = new Map()
    links.forEach((l) => {
      d.set(l.source, (d.get(l.source) ?? 0) + 1)
      d.set(l.target, (d.get(l.target) ?? 0) + 1)
    })
    return d
  }, [links])

  // 배치가 바뀌면 전체가 보이게 맞춘다
  const fit = useMemo(() => {
    const ps = [...pos.values()]
    if (ps.length === 0) return { x: -100, y: -100, w: 200, h: 200 }
    const xs = ps.map((p) => p.x)
    const ys = ps.map((p) => p.y)
    const pad = 80
    return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 }
  }, [pos])
  useEffect(() => setView(fit), [fit])
  const vb = view ?? fit
  // 화면 1px이 그래프 좌표로 얼마인지 — viewBox 기본 맞춤(meet)이라 가로·세로 중 큰 비율을 쓴다
  const svgHeight = svgRef.current?.clientHeight || svgWidth
  const unit = Math.max(vb.w / svgWidth, vb.h / svgHeight)

  const focus = selected ?? hover
  const neighbors = useMemo(() => {
    if (!focus) return null
    const s = new Set([focus])
    links.forEach((l) => {
      if (l.source === focus) s.add(l.target)
      if (l.target === focus) s.add(l.source)
    })
    return s
  }, [focus, links])

  const toGraph = (e) => {
    const r = svgRef.current.getBoundingClientRect()
    return { x: vb.x + ((e.clientX - r.left) / r.width) * vb.w, y: vb.y + ((e.clientY - r.top) / r.height) * vb.h }
  }
  const onWheel = (e) => {
    e.preventDefault()
    const p = toGraph(e)
    const s = e.deltaY > 0 ? 1.15 : 1 / 1.15
    setView({ x: p.x - (p.x - vb.x) * s, y: p.y - (p.y - vb.y) * s, w: vb.w * s, h: vb.h * s })
  }
  useEffect(() => {
    const el = svgRef.current
    if (!el) return undefined
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })
  const onDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, vb, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const r = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - d.sx) / r.width) * d.vb.w
    const dy = ((e.clientY - d.sy) / r.height) * d.vb.h
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true
    setView({ ...d.vb, x: d.vb.x - dx, y: d.vb.y - dy })
  }
  const onUp = () => {
    if (drag.current && !drag.current.moved) setSelected(null)
    drag.current = null
  }

  const counts = useMemo(() => {
    const c = {}
    data.nodes.forEach((n) => (c[n.label] = (c[n.label] ?? 0) + 1))
    return c
  }, [data])
  const sel = selected ? byId.get(selected) : null
  const selLinks = sel ? links.filter((l) => l.source === sel.id || l.target === sel.id) : []

  return (
    <div className="gm-graph">
      <div className="gm-legend">
        {Object.entries(LABELS).map(([label, { name, color }]) => (
          <button
            key={label}
            type="button"
            className={`gm-legend-item${hidden.has(label) ? ' is-off' : ''}`}
            onClick={() =>
              setHidden((prev) => {
                const next = new Set(prev)
                if (next.has(label)) next.delete(label)
                else next.add(label)
                return next
              })
            }
            title={hidden.has(label) ? '보이기' : '숨기기'}
          >
            <i style={{ background: color }} />
            {name} <em>{counts[label] ?? 0}</em>
          </button>
        ))}
        <span className="gm-legend-meta">관계 {links.length} · 끌어서 이동, 휠로 확대, 노드를 눌러 연결 보기</span>
        <button type="button" className="gm-legend-item" onClick={() => setView(fit)}>
          전체 보기
        </button>
      </div>

      <svg
        ref={svgRef}
        className="gm-svg"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        role="img"
        aria-label="지식 그래프"
      >
        <g>
          {links.map((l, i) => {
            const a = pos.get(l.source)
            const b = pos.get(l.target)
            const on = neighbors && (l.source === focus || l.target === focus)
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={`gm-link${on ? ' is-on' : ''}${neighbors && !on ? ' is-dim' : ''}`}
                strokeWidth={(on ? 2 : 1) * unit}
              />
            )
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const p = pos.get(n.id)
            const r = (5 + Math.min(10, Math.sqrt(degree.get(n.id) ?? 0) * 2)) * unit
            const dim = neighbors && !neighbors.has(n.id)
            const showLabel = (neighbors ? neighbors.has(n.id) : ['Skill', 'Project', 'Category', 'Purpose'].includes(n.label) && (degree.get(n.id) ?? 0) >= 2)
            return (
              <g
                key={n.id}
                className={`gm-node${dim ? ' is-dim' : ''}${selected === n.id ? ' is-sel' : ''}`}
                transform={`translate(${p.x} ${p.y})`}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setSelected(selected === n.id ? null : n.id)}
              >
                <circle r={r} fill={LABELS[n.label]?.color ?? '#888'} strokeWidth={1.5 * unit} />
                {showLabel && (
                  <text y={-r - 4 * unit} fontSize={12 * unit} textAnchor="middle">
                    {n.name}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {sel && (
        <aside className="gm-info">
          <p className="gm-info-kind" style={{ color: LABELS[sel.label]?.color }}>{LABELS[sel.label]?.name ?? sel.label}</p>
          <h3>{sel.name}</h3>
          {(sel.label === 'Note' || sel.label === 'Code') && (
            <p className="gm-info-meta">
              조각 {sel.chunks} · 임베딩 {sel.embedded}
              {sel.chunks !== sel.embedded && <b> (임베딩 부족)</b>}
            </p>
          )}
          {docUrl(sel) && (
            <Link to={docUrl(sel)} className="gm-info-link">
              페이지 열기 →
            </Link>
          )}
          <ul>
            {selLinks.map((l, i) => {
              const other = byId.get(l.source === sel.id ? l.target : l.source)
              return (
                <li key={i}>
                  <span className="gm-rel">{l.source === sel.id ? `${l.type} →` : `← ${l.type}`}</span>
                  <button type="button" onClick={() => setSelected(other.id)}>
                    <i style={{ background: LABELS[other.label]?.color }} />
                    {other.name}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
      )}
    </div>
  )
}

// ---- 조각·임베딩: 글·코드마다 조각 수와 임베딩 수, 누르면 조각 내용 ----
function ChunkView({ data }) {
  const docs = useMemo(
    () =>
      data.nodes
        .filter((n) => n.label === 'Note' || n.label === 'Code')
        .sort((a, b) => (a.chunks === a.embedded) - (b.chunks === b.embedded) || a.label.localeCompare(b.label) || a.name.localeCompare(b.name, 'ko')),
    [data],
  )
  const [open, setOpen] = useState(null)
  const [chunks, setChunks] = useState(null)
  const [error, setError] = useState(null)
  const totals = docs.reduce((t, d) => ({ chunks: t.chunks + (d.chunks ?? 0), embedded: t.embedded + (d.embedded ?? 0) }), { chunks: 0, embedded: 0 })

  const show = (doc) => {
    setOpen(doc)
    setChunks(null)
    setError(null)
    apiGet(`/api/graph/chunks?type=${doc.label === 'Note' ? 'note' : 'code'}&id=${doc.ref}`).then(setChunks).catch((err) => setError(err.message))
  }

  return (
    <div className="gm-chunks">
      <div className="gm-doclist">
        <p className="gm-total">
          전체 조각 {totals.chunks} · 임베딩 {totals.embedded}
          {totals.chunks !== totals.embedded && <b> — {totals.chunks - totals.embedded}개 비어 있음</b>}
        </p>
        <ul>
          {docs.map((d) => (
            <li key={d.id}>
              <button type="button" className={`gm-doc${open?.id === d.id ? ' is-on' : ''}`} onClick={() => show(d)}>
                <i style={{ background: LABELS[d.label].color }} />
                <span>{d.name}</span>
                <em className={d.chunks === d.embedded && d.chunks > 0 ? '' : 'is-warn'}>
                  {d.embedded}/{d.chunks}
                </em>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="gm-chunkpane">
        {!open && <p className="status">왼쪽에서 글·코드를 고르면 검색 조각을 보여 줍니다.</p>}
        {open && (
          <>
            <h3>
              {open.name} {docUrl(open) && <Link to={docUrl(open)}>열기 →</Link>}
            </h3>
            {error && <p className="status status-error">{error}</p>}
            {!error && !chunks && <p className="status">불러오는 중...</p>}
            {chunks?.length === 0 && <p className="status">조각이 없습니다.</p>}
            {chunks?.map((c) => (
              <article key={c.id} className="gm-chunk">
                <p className="gm-chunk-head">
                  <b>#{c.idx}</b> {c.length}자 · {c.embedded ? `임베딩 ✓ (${c.dims}차원)` : <span className="is-warn">임베딩 없음</span>}
                </p>
                <pre>{c.text}</pre>
              </article>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ---- 검색 시험: 질문에 어떤 조각이 걸리는지(벡터·키워드·합친 순위). 답변은 만들지 않는다 ----
function SearchTest() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function run(e) {
    e.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    setError(null)
    try {
      setResult(await apiMutate('/api/graph/search-test', 'POST', { query }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const column = (title, hits, note) => (
    <section className="gm-col">
      <h4>
        {title} <em>{hits.length}</em>
      </h4>
      <p className="gm-col-note">{note}</p>
      <ol>
        {hits.map((h) => (
          <li key={h.id}>
            <Link to={h.docType === 'note' ? `/archive/${h.docId}` : `/codebase/${h.docId}`}>{h.title}</Link>
            {h.score !== undefined && <span className="gm-score">{Number(h.score).toFixed(3)}</span>}
            <p>{h.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )

  return (
    <div className="gm-search">
      <form onSubmit={run} className="gm-search-form">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="질문을 넣고 어떤 조각이 걸리는지 확인 (답변 요금 없음)" maxLength={500} />
        <button type="submit" disabled={busy}>
          {busy ? '찾는 중...' : '검색'}
        </button>
      </form>
      {error && <p className="status status-error">{error}</p>}
      {result && (
        <div className="gm-cols">
          {column('벡터', result.vector, '의미가 가까운 순(코사인 유사도)')}
          {column('키워드', result.keyword, '낱말이 겹치는 순(전문 검색 점수)')}
          {column('합친 결과', result.fused, 'AI 답변에 실제로 들어가는 조각')}
        </div>
      )}
    </div>
  )
}

export default GraphMonitor
