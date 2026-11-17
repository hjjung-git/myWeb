import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'
import { SECTIONS, activeSectionFor } from '../lib/sections.js'

// Portfolio(홈) 안의 섹션 탭 — 홈에서는 그 자리에서 부드럽게 스크롤 이동,
// 다른 화면(영역별 전용 페이지, 포트폴리오/자격증 상세·수정 등)에서는 홈으로 돌아가면서 해당 섹션으로 이동.
// Archive는 섹션이 아니라 별도 공간이라 여기 없고, 헤더의 SiteSwitch(Portfolio | Archive)로 들어간다.
// Archive 화면에서는 섹션 탭 자체를 숨긴다. (좁은 화면에서는 CSS로 숨기고 FloatingNav가 대신한다.)
// 밑줄은 탭마다 따로 긋지 않고 하나가 선택된 탭으로 미끄러져 이동한다(위치·폭을 재서 transform으로 옮김).
function TabNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeId, pinActive } = useActiveSection()
  const navRef = useRef(null)
  const [bar, setBar] = useState(null)

  const isArchive = location.pathname.startsWith('/archive')
  const effectiveActive = activeSectionFor(location.pathname, activeId)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (isArchive || !nav) return undefined
    const measure = () => {
      const el = nav.querySelector('.tab-link.active')
      setBar(el ? { x: el.offsetLeft, y: el.offsetTop + el.offsetHeight - 1, w: el.offsetWidth } : null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    // 글꼴이 늦게 뜨면 탭 폭이 바뀌므로 다시 잰다.
    document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [isArchive, effectiveActive])

  if (isArchive) return null

  function handleClick(e, id) {
    e.preventDefault()
    pinActive(id)
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${id}`)
    }
  }

  return (
    <nav className={`tab-nav${bar ? ' has-indicator' : ''}`} ref={navRef}>
      {SECTIONS.map((tab) => (
        <a
          key={tab.id}
          href={`/#${tab.id}`}
          className={effectiveActive === tab.id ? 'tab-link active' : 'tab-link'}
          onClick={(e) => handleClick(e, tab.id)}
        >
          {tab.label}
        </a>
      ))}
      {bar && (
        <span
          className="tab-indicator"
          aria-hidden="true"
          style={{ width: bar.w, transform: `translate(${bar.x}px, ${bar.y}px)` }}
        />
      )}
    </nav>
  )
}

export default TabNav
