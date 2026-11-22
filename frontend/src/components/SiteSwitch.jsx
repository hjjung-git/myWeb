import { NavLink, useLocation } from 'react-router-dom'

// 사이트의 두 축 — Portfolio(한 페이지 이력), Archive(Notes + Codebase) — 를 오가는 스위치.
// Codebase는 Archive 안(오른쪽 사이드바)으로 들어갔으므로 /codebase 에서도 Archive가 켜진다.
function SiteSwitch() {
  const { pathname } = useLocation()
  const area = pathname.startsWith('/archive') || pathname.startsWith('/codebase') ? 'archive' : 'portfolio'

  return (
    <nav className="site-switch" aria-label="사이트 영역">
      <NavLink to="/" className={() => (area === 'portfolio' ? 'active' : '')} end>
        Portfolio
      </NavLink>
      <NavLink to="/archive" className={() => (area === 'archive' ? 'active' : '')}>
        Archive
      </NavLink>
    </nav>
  )
}

export default SiteSwitch
