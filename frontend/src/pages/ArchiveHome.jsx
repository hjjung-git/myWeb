import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { pathOf } from '../lib/archiveTree.js'
import ArchiveMark from '../components/ArchiveMark.jsx'

const MAX_RESULTS = 8

// Archive 첫 화면(/archive) — 대표 그림과 검색창만. 글 목록은 왼쪽 사이드바에 있다.
function ArchiveHome() {
  const { isAdmin } = useAuth()
  const { posts, indexError } = useOutletContext()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const q = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q || !posts) return null
    return posts.filter((p) => `${p.title} ${pathOf(p).join(' ')}`.toLowerCase().includes(q))
  }, [q, posts])
  const shown = matches ? matches.slice(0, MAX_RESULTS) : null

  useEffect(() => setActive(0), [q])

  // "/" 를 누르면 검색창으로 (다른 입력칸에 쓰는 중이면 무시)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onInputKey = (e) => {
    if (e.key === 'Escape') setQuery('')
    if (!shown || shown.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, shown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      navigate(`/archive/${shown[active].id}`)
    }
  }

  return (
    <section className="archive-home">
      <ArchiveMark />

      <div className="home-searchbox">
        <svg className="home-search-icon" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M13 13l4 4" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="home-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKey}
          placeholder="글 검색"
          aria-label="글 검색"
          autoComplete="off"
          spellCheck="false"
        />
        {query ? (
          <button type="button" className="home-search-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="검색어 지우기">
            ×
          </button>
        ) : (
          <kbd className="home-search-hint" aria-hidden="true">/</kbd>
        )}
      </div>

      {indexError && <p className="status status-error">목록을 불러오지 못했습니다. ({indexError})</p>}

      {shown && (
        <div className="home-results" role="listbox" aria-label="검색 결과">
          {shown.length === 0 && <p className="home-results-empty">검색 결과가 없습니다.</p>}
          {shown.map((post, i) => (
            <Link
              key={post.id}
              to={`/archive/${post.id}`}
              role="option"
              aria-selected={i === active}
              className={`home-result${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
            >
              <span className="home-result-title">{post.title}</span>
              <span className="home-result-path">{pathOf(post).join(' › ')}</span>
            </Link>
          ))}
          {matches.length > MAX_RESULTS && (
            <p className="home-results-more">외 {matches.length - MAX_RESULTS}개 — 검색어를 더 구체적으로 써 보세요</p>
          )}
        </div>
      )}

      {isAdmin && !shown && (
        <Link to="/archive/new" className="home-new">+ 새 글 작성</Link>
      )}
    </section>
  )
}

export default ArchiveHome
