import { useEffect, useMemo } from 'react'
import { NavLink, matchPath, useLocation } from 'react-router-dom'
import { groupByCategory, languagesOf } from '../lib/codebase.js'
import { languageColor } from '../lib/github.js'
import { keyOf, useOpenKeys } from '../lib/useOpenKeys.js'
import SideDrawer from './SideDrawer.jsx'

// Archive 오른쪽 사이드바(Codebase) — 주제 > 코드 제목 트리. 왼쪽 Notes 트리와 같은 모양(대분류 자리에 주제).
// 제목 옆 작은 점은 그 글에 들어 있는 언어들. 검색(언어 이름으로 찾기 포함)은 Archive 홈의 통합 검색에서.
function CodebaseSidebar({ snippets, error }) {
  const location = useLocation()
  const [openKeys, toggle, reveal] = useOpenKeys('codebase-tree-open')
  const groups = useMemo(() => groupByCategory(snippets ?? []), [snippets])

  // 코드 상세 화면이면 그 코드의 주제를 펼쳐 둔다.
  const snippetId = Number(matchPath('/codebase/:id', location.pathname)?.params.id)
  const revealCategory = groups.find((g) => g.items.some((s) => s.id === snippetId))?.category ?? ''
  useEffect(() => {
    if (revealCategory) reveal([keyOf([revealCategory])])
  }, [revealCategory, reveal])

  return (
    <SideDrawer side="right" id="codebase-drawer" title="Codebase" openLabel="Codebase 목록 열기">
      <nav className="archive-tree" aria-label="Codebase 주제">
        {error && <p className="status status-error">코드 목록을 불러오지 못했습니다.</p>}
        {!error && snippets === null && <p className="status">불러오는 중...</p>}
        {!error && snippets?.length === 0 && <p className="status">아직 등록된 코드가 없습니다.</p>}

        {groups.map(({ category, items }) => {
          const key = keyOf([category])
          const isOpen = openKeys.has(key)
          return (
            <div key={category} className="tree-node tree-depth-0">
              <button type="button" className="tree-row" onClick={() => toggle(key)} aria-expanded={isOpen}>
                <span className="tree-name">{category}</span>
                <span className="tree-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <ul className="tree-posts">
                  {items.map((s) => (
                    <li key={s.id}>
                      <NavLink to={`/codebase/${s.id}`}>
                        {s.title}
                        <span className="tree-langs" aria-label={languagesOf(s).join(', ')}>
                          {languagesOf(s).map((l) => (
                            <i key={l} title={l} style={{ background: languageColor(l) }} />
                          ))}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </SideDrawer>
  )
}

export default CodebaseSidebar
