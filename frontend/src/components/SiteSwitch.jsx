import { NavLink, useLocation } from 'react-router-dom'

// 사이트의 세 축 — Portfolio(한 페이지 이력), Archive(지식 기록), Codebase(코드 저장소) — 을 오가는 스위치.
// 섹션 탭 중 하나가 아니라 Portfolio와 같은 무게의 독립된 공간으로 보이게 한다.
function SiteSwitch() {
  const { pathname } = useLocation()
  const area = pathname.startsWith('/archive') ? 'archive' : pathname.startsWith('/codebase') ? 'codebase' : 'portfolio'

  return (
    <nav className="site-switch" aria-label="사이트 영역">
      <NavLink to="/" className={() => (area === 'portfolio' ? 'active' : '')} end>
        Portfolio
      </NavLink>
      <NavLink to="/archive" className={() => (area === 'archive' ? 'active' : '')}>
        Archive
      </NavLink>
      <NavLink to="/codebase" className={() => (area === 'codebase' ? 'active' : '')}>
        Codebase
      </NavLink>
    </nav>
  )
}

export default SiteSwitch
