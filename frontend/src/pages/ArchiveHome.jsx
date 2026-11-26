import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { pathOf } from '../lib/archiveTree.js'
import { languagesOf } from '../lib/codebase.js'
import { languageInQuery, searchAll } from '../lib/search.js'
import ArchiveMark from '../components/ArchiveMark.jsx'
import GraphAdminPanel from '../components/GraphAdminPanel.jsx'
import ChatThread, { ChatHistory } from '../components/ChatThread.jsx'
import GraphMonitor from '../components/GraphMonitor.jsx'
import { useArchiveChat } from '../lib/useArchiveChat.js'

const MAX_PER_GROUP = 5

// Archive 첫 화면(/archive) — 대표 그림과 통합 검색창. 검색·둘러보기는 모두 여기서 한다(Notes·Codebase 따로의 메인 화면은 없다).
// 검색은 Notes 글(제목·분류·관련 기술)과 Codebase 코드(제목·설명·주제·언어·관련 기술)를 한 번에 찾아
// 'Notes'·'Codebase' 두 묶음으로 보여 준다. 글 목록은 왼쪽(Notes)·오른쪽(Codebase) 사이드바에 있다.
function ArchiveHome() {
  const { isAdmin } = useAuth()
  const { posts, indexError, snippets, snippetError } = useOutletContext()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState({}) // 묶음별 '더 보기'로 펼침
  // AI 질문(Hybrid RAG) — 서버가 '쓸 수 있음'이라고 할 때만 '검색 | AI 질문' 전환이 보인다
  const chat = useArchiveChat()
  const [mode, setMode] = useState('search')
  const [graphOpen, setGraphOpen] = useState(false) // 누구나 여는 읽기 전용 그래프 보기
  const asking = mode === 'ask'
  // 대화가 있으면 대표 그림을 숨기고 [대화 칸 → 입력창] 순서로 — 대화가 화면을 쭉 쓴다
  const inConversation = asking && chat.turns.length > 0
  const found = useMemo(() => (asking ? null : searchAll(query, posts, snippets)), [asking, query, posts, snippets])

  // 화면에 보이는 결과(묶음마다 최대 5개)를 한 줄로 펼쳐 ↑↓·Enter가 두 묶음을 이어서 움직이게 한다.
  const groups = useMemo(() => {
    if (!found) return null
    const codeLink = (s) => {
      const lang = languageInQuery(query, s)
      return lang ? `/codebase/${s.id}?lang=${encodeURIComponent(lang)}` : `/codebase/${s.id}`
    }
    return [
      {
        key: 'posts',
        label: 'Notes',
        total: found.posts.length,
        items: (expanded.posts ? found.posts : found.posts.slice(0, MAX_PER_GROUP)).map((p) => ({
          key: `p${p.id}`, to: `/archive/${p.id}`, title: p.title, meta: pathOf(p).join(' › '),
        })),
      },
      {
        key: 'snippets',
        label: 'Codebase',
        total: found.snippets.length,
        error: snippetError,
        items: (expanded.snippets ? found.snippets : found.snippets.slice(0, MAX_PER_GROUP)).map((s) => ({
          key: `s${s.id}`, to: codeLink(s), title: s.title,
          meta: [s.category, languagesOf(s).join(' · ')].filter(Boolean).join(' — '),
        })),
      },
    ]
  }, [found, query, snippetError, expanded])
  const flat = useMemo(() => (groups ? groups.flatMap((g) => g.items) : []), [groups])
  const nothing = groups && flat.length === 0 && !snippetError

  useEffect(() => {
    setActive(0)
    setExpanded({})
  }, [query])

  // 답변이 끝나면 다시 입력할 수 있게 입력칸으로
  useEffect(() => {
    if (asking && !chat.asking) inputRef.current?.focus()
  }, [asking, chat.asking])

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
    if (asking) {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing && query.trim()) {
        e.preventDefault()
        chat.ask(query)
        setQuery('')
      }
      if (e.key === 'Escape') setQuery('')
      return
    }
    if (e.key === 'Escape') setQuery('')
    if (flat.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      navigate(flat[active].to)
    }
  }

  let index = -1
  return (
    <section className={`archive-home${inConversation ? ' is-chat' : ''}`}>
      {!inConversation && <ArchiveMark />}

      {chat.status?.available && (
        <div className="home-mode" role="tablist" aria-label="검색 방식">
          {[
            ['search', '검색'],
            ['ask', 'AI 질문'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              className={`home-mode-btn${mode === key ? ' is-on' : ''}`}
              onClick={() => {
                setMode(key)
                inputRef.current?.focus()
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {inConversation && (
        <ChatThread
          turns={chat.turns}
          asking={chat.asking}
          past={chat.past}
          onReset={chat.reset}
          onOpen={chat.open}
          onRemove={chat.remove}
        />
      )}

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
          placeholder={asking ? '내 글·코드에 물어보기 (Enter)' : '글·코드 검색'}
          aria-label={asking ? '내 글과 코드에 AI로 질문' : '글과 코드 검색'}
          disabled={asking && chat.asking}
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

      {indexError && <p className="status status-error">글 목록을 불러오지 못했습니다. ({indexError})</p>}

      {groups && (
        <div className="home-results" role="listbox" aria-label="검색 결과">
          {nothing && <p className="home-results-empty">검색 결과가 없습니다.</p>}
          {!nothing && groups.map((g) => (g.total === 0 && !g.error ? null : (
            <div key={g.key} className="home-results-group" role="group" aria-label={g.label}>
              <p className="home-results-head">
                <span>{g.label}</span>
                <em>{g.total}</em>
              </p>
              {g.error && <p className="home-results-empty">코드 목록을 불러오지 못했습니다.</p>}
              {g.items.map((item) => {
                index += 1
                const i = index
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    role="option"
                    aria-selected={i === active}
                    className={`home-result${i === active ? ' is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                  >
                    <span className="home-result-title">{item.title}</span>
                    {item.meta && <span className="home-result-path">{item.meta}</span>}
                  </Link>
                )
              })}
              {g.total > MAX_PER_GROUP && !expanded[g.key] && (
                <button
                  type="button"
                  className="home-results-more home-results-all"
                  onClick={() => {
                    setExpanded((prev) => ({ ...prev, [g.key]: true }))
                    inputRef.current?.focus()
                  }}
                >
                  {g.total - MAX_PER_GROUP}개 더 보기
                </button>
              )}
            </div>
          )))}
        </div>
      )}

      {asking && !inConversation && chat.past.length > 0 && (
        <div className="chat-past-only">
          <p className="home-results-head"><span>지난 대화</span><em>{chat.past.length}</em></p>
          <ChatHistory past={chat.past} onOpen={chat.open} onRemove={chat.remove} />
        </div>
      )}

      {!groups && !asking && (
        <button type="button" className="home-graph-link" onClick={() => setGraphOpen(true)}>
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <circle cx="4" cy="14" r="2.2" />
            <circle cx="10" cy="5" r="2.2" />
            <circle cx="16" cy="13" r="2.2" />
            <path d="M5.6 12.6 8.5 6.6M11.6 6.3l3 5.1M6.2 14.2h7.6" />
          </svg>
          지식 그래프 보기
        </button>
      )}
      {graphOpen && <GraphMonitor admin={isAdmin} onClose={() => setGraphOpen(false)} />}

      {isAdmin && !groups && !asking && (
        <>
          <div className="home-new-row">
            <Link to="/archive/new" className="home-new">+ 새 글 작성</Link>
            <Link to="/codebase/new" className="home-new">+ 새 코드</Link>
          </div>
          <GraphAdminPanel />
        </>
      )}
    </section>
  )
}

export default ArchiveHome
