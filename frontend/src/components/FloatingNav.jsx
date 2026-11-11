import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'
import { SECTIONS, activeSectionFor } from '../lib/sections.js'

// 좁은 화면(상단 탭이 숨는 폭)에서 오른쪽 아래에 떠 있는 영역 이동 메뉴.
// 버튼을 누르면 섹션 목록이 위로 펼쳐지고, 고르면 그 섹션으로 이동한다. (넓은 화면에서는 CSS로 숨김)
function FloatingNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { activeId } = useActiveSection()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // 화면이 바뀌면 닫는다.
  useEffect(() => setOpen(false), [pathname])

  // 바깥을 누르거나 Esc를 누르면 닫는다.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (pathname.startsWith('/archive')) return null

  const active = activeSectionFor(pathname, activeId)

  function go(id) {
    setOpen(false)
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${id}`)
    }
  }

  function goTop() {
    setOpen(false)
    if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
    else navigate('/')
  }

  return (
    <div className={`float-nav${open ? ' is-open' : ''}`} ref={rootRef}>
      {open && (
        <ul className="float-nav-menu" aria-label="영역 이동">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                className={active === section.id ? 'is-active' : undefined}
                aria-current={active === section.id ? 'true' : undefined}
                onClick={() => go(section.id)}
              >
                {section.label}
              </button>
            </li>
          ))}
          <li className="float-nav-top">
            <button type="button" onClick={goTop}>↑ 맨 위로</button>
          </li>
        </ul>
      )}
      <button
        type="button"
        className="float-nav-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? '영역 메뉴 닫기' : '영역 메뉴 열기'}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
        </svg>
      </button>
    </div>
  )
}

export default FloatingNav
