import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Archive 양쪽 사이드바의 공통 틀 — 왼쪽은 Notes, 오른쪽은 Codebase.
// 자리가 넉넉하면 화면 양옆 칸에 그대로 보이고, 자리가 모자라면(CSS가 정함: 창 폭, 용어 메모가 있는 글)
// 화면 가장자리 밖으로 접혀 가장자리 탭만 남는다. 탭에 마우스를 올리거나 누르면(터치 포함) 서랍처럼 펼쳐진다.
//  · 올려서 연 것은 마우스가 벗어나면 닫히고, 눌러서 연 것(펼친 목록 안을 누른 것 포함)은 바깥을 누르거나 Esc·화면 이동 때 닫힌다.
const ARROW = { left: 'M9 5l7 7-7 7', right: 'M15 5l-7 7 7 7' }

function SideDrawer({ side, id, title, openLabel, children }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false) // 눌러서 연 상태 — 마우스가 벗어나도 유지

  const close = useCallback(() => {
    setOpen(false)
    setPinned(false)
  }, [])

  useEffect(() => {
    close()
  }, [location.pathname, close])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const hoverCapable = () => typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover)').matches

  return (
    <>
      <button
        type="button"
        className={`archive-edge-tab archive-edge-tab--${side}${open ? ' is-hidden' : ''}`}
        aria-label={openLabel}
        title={title}
        aria-expanded={open}
        aria-controls={id}
        onMouseEnter={() => hoverCapable() && setOpen(true)}
        onClick={() => {
          setOpen(true)
          setPinned(true)
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ARROW[side]} />
        </svg>
      </button>
      {open && <div className={`archive-scrim archive-scrim--${side}`} onClick={close} aria-hidden="true" />}

      <aside
        id={id}
        className={`archive-sidebar archive-sidebar--${side}${open ? ' is-open' : ''}`}
        onMouseLeave={() => !pinned && setOpen(false)}
        onClick={() => setPinned(true)}
      >
        <p className="sidebar-title">{title}</p>
        {children}
      </aside>
    </>
  )
}

export default SideDrawer
