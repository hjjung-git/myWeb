import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'
import About from './About.jsx'
import Skills from './Skills.jsx'
import PortfolioList from './PortfolioList.jsx'
import Educations from './Educations.jsx'
import Certifications from './Certifications.jsx'
import Contact from './Contact.jsx'

// 이력/커리어 흐름(About~Educations~Certifications) 뒤에 Contact — 탭 순서(TabNav.jsx)와 동일하게 맞춘다.
// Archive는 홈의 섹션이 아니라 별도 화면(/archive)이다.
const SECTION_IDS = ['about', 'skills', 'portfolio', 'educations', 'certifications', 'contact']

// 한 페이지 스크롤 홈 — 탭을 누르면 페이지 이동이 아니라 해당 섹션으로 부드럽게 스크롤된다.
// 지금 보고 있는 섹션은 IntersectionObserver로 추적해 상단 탭 하이라이트에 반영한다.
function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setActiveId } = useActiveSection()

  // "/#section"으로 들어왔을 때의 스크롤과, 상세 화면에서 돌아왔을 때의 위치 복원은 ScrollManager가 맡는다.
  // 여기서는 예전 링크(/#archive)만 Archive 목록으로 보낸다.
  useEffect(() => {
    if (location.hash === '#archive') navigate('/archive', { replace: true })
  }, [location.hash, navigate])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
        )
        setActiveId(topMost.target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    )

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean)
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [setActiveId])

  return (
    <>
      <About />
      <Skills />
      <PortfolioList />
      <Educations />
      <Certifications />
      <Contact />
    </>
  )
}

export default Home
