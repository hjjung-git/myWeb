import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { languageColor } from '../lib/github.js'
import { splitTech } from '../lib/portfolioApi.js'
import { groupByLanguage } from '../lib/codebase.js'

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
}

// Codebase(/codebase) — 프로젝트에 쓴 로직, 공부하며 기록한 코드를 언어별로 모아 둔 저장소.
// 지식을 글로 정리하는 Archive와 달리 코드가 중심이다. 언어로 거르고 검색할 수 있다.
function CodebaseHome() {
  const { isAdmin } = useAuth()
  const [snippets, setSnippets] = useState(null)
  const [error, setError] = useState(null)
  const [lang, setLang] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiGet('/api/snippets').then(setSnippets).catch((err) => setError(err.message))
  }, [])

  const languages = useMemo(() => {
    const count = new Map()
    snippets?.forEach((s) => count.set(s.language, (count.get(s.language) ?? 0) + 1))
    return [...count.entries()].sort((a, b) => b[1] - a[1])
  }, [snippets])

  const q = query.trim().toLowerCase()
  const shown = (snippets ?? []).filter(
    (s) =>
      (!lang || s.language === lang) &&
      (!q || `${s.title} ${s.description ?? ''} ${s.relatedSkills ?? ''}`.toLowerCase().includes(q)),
  )

  return (
    <div className="codebase">
      <h1 className="section-title section-page-title">코드 저장소</h1>
      <p className="lede section-page-lede">
        프로젝트에 쓴 로직과 공부하며 기록한 코드를 언어별로 모아 둔 곳입니다. 지식을 글로 정리하는 Archive와 달리, 바로 가져다 쓸 수 있는 코드가 중심이며, 언어별로 나누고 용도(재사용 알고리즘·효율적인 코드·짧은 표현)로 묶었습니다.
      </p>

      <div className="cb-toolbar">
        <input
          type="search"
          className="cb-search"
          placeholder="제목·설명·기술로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="코드 검색"
        />
        {isAdmin && (
          <Link to="/codebase/new" className="btn-primary">+ 새 코드</Link>
        )}
      </div>

      {languages.length > 0 && (
        <div className="cb-langs" role="group" aria-label="언어 필터">
          <button type="button" className={`cb-lang${lang === '' ? ' is-on' : ''}`} onClick={() => setLang('')}>
            전체 <em>{snippets.length}</em>
          </button>
          {languages.map(([name, n]) => (
            <button key={name} type="button" className={`cb-lang${lang === name ? ' is-on' : ''}`} onClick={() => setLang(lang === name ? '' : name)}>
              <i style={{ background: languageColor(name) }} />
              {name} <em>{n}</em>
            </button>
          ))}
        </div>
      )}

      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && snippets === null && <p className="status">불러오는 중...</p>}
      {!error && snippets?.length === 0 && <p className="status">아직 등록된 코드가 없습니다.</p>}
      {!error && snippets?.length > 0 && shown.length === 0 && <p className="status">조건에 맞는 코드가 없습니다.</p>}

      <div className="cb-frames">
        {groupByLanguage(shown).map(({ language, items, groups }) => (
          <section key={language} className="cb-frame" aria-labelledby={`cb-lang-${language}`}>
            <h2 id={`cb-lang-${language}`} className="cb-frame-head">
              <i style={{ background: languageColor(language) }} />
              {language} <em>{items.length}</em>
            </h2>
            {groups.map(({ category, items: list }) => (
              <div key={category} className="cb-group">
                <h3 className="cb-group-title">{category} <em>{list.length}</em></h3>
                <ul className="cb-list">
                  {list.map((s) => (
                    <li key={s.id}>
                      <Link to={`/codebase/${s.id}`} className="cb-row">
                        <span className="cb-row-main">
                          <strong>{s.title}</strong>
                          {s.description && <span>{s.description}</span>}
                        </span>
                        <time>{formatDate(s.lastModifiedAt)}</time>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

export default CodebaseHome
