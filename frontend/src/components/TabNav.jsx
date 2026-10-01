import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'portfolio', label: 'Experience / Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'contact', label: 'Contact' },
]

// 상단 탭 — 홈에서는 그 자리에서 부드럽게 스크롤 이동, 다른 화면(상세/수정 등)에서는
// 홈으로 돌아가면서 해당 섹션으로 이동한다. 탭 자체가 라우트를 바꾸는 건 아니다.
function TabNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeId } = useActiveSection()

  // 상세/수정/작성 화면을 보는 중에는 "Experience / Projects" 탭을 활성 표시해준다.
  const effectiveActive = location.pathname.startsWith('/portfolio') ? 'portfolio' : activeId

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
