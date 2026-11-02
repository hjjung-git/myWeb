import { NavLink, useLocation } from 'react-router-dom'

// 사이트의 두 축 — Portfolio(한 페이지 이력)와 Archive(기록) — 을 오가는 스위치.
// Archive는 섹션 탭 중 하나가 아니라 Portfolio와 같은 무게의 독립된 공간으로 보이게 한다.
function SiteSwitch() {
  const { pathname } = useLocation()
  const inArchive = pathname.startsWith('/archive')

  return (
    <nav className="site-switch" aria-label="사이트 영역">
      <NavLink to="/" className={() => (inArchive ? '' : 'active')} end>
        Portfolio
      </NavLink>
      <NavLink to="/archive" className={() => (inArchive ? 'active' : '')}>
        Archive
      </NavLink>
    </nav>
  )
}

export default SiteSwitch
