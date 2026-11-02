import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'

// Portfolio(홈) 안의 섹션 탭 — 홈에서는 그 자리에서 부드럽게 스크롤 이동,
// 다른 화면(포트폴리오/자격증 상세·수정 등)에서는 홈으로 돌아가면서 해당 섹션으로 이동.
// Archive는 섹션이 아니라 별도 공간이라 여기 없고, 헤더의 SiteSwitch(Portfolio | Archive)로 들어간다.
// Archive 화면에서는 섹션 탭 자체를 숨긴다.
const TABS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'portfolio', label: 'Career / Projects' },
  { id: 'certifications', label: '어학 / 자격증' },
  { id: 'contact', label: 'Contact' },
]

function TabNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeId } = useActiveSection()

  if (location.pathname.startsWith('/archive')) return null

  let effectiveActive = activeId
  if (location.pathname.startsWith('/portfolio')) effectiveActive = 'portfolio'
  else if (location.pathname.startsWith('/certifications')) effectiveActive = 'certifications'

  function handleClick(e, id) {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${id}`)
    }
  }

  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <a
          key={tab.id}
          href={`/#${tab.id}`}
          className={effectiveActive === tab.id ? 'tab-link active' : 'tab-link'}
          onClick={(e) => handleClick(e, tab.id)}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  )
}

export default TabNav
