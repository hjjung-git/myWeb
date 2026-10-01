import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'

// 모든 탭이 동일하게 동작한다 — 홈에서는 그 자리에서 부드럽게 스크롤 이동,
// 다른 화면(아카이브 전체 목록, 상세/수정 등)에서는 홈으로 돌아가면서 해당 섹션으로 이동.
// 탭 자체는 라우트를 바꾸지 않는다 (아카이브 전체 목록/상세는 미리보기의 "더보기" 버튼으로만 들어간다).
// 순서: About → Skills → Portfolio → Certifications 까지가 이력/커리어 흐름이고,
// Archive(글/기록)는 보조 콘텐츠라 그 흐름 뒤, Contact 바로 앞에 둔다.
const TABS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'portfolio', label: 'Experience / Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'archive', label: 'Archive' },
  { id: 'contact', label: 'Contact' },
]

function TabNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeId } = useActiveSection()

  let effectiveActive = activeId
  if (location.pathname.startsWith('/portfolio')) effectiveActive = 'portfolio'
  else if (location.pathname.startsWith('/archive')) effectiveActive = 'archive'

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
