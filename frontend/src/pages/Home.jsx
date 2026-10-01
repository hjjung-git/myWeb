import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'
import About from './About.jsx'
import Skills from './Skills.jsx'
import PortfolioList from './PortfolioList.jsx'
import Certifications from './Certifications.jsx'
import ArchivePreview from './ArchivePreview.jsx'
import Contact from './Contact.jsx'

// 이력/커리어 흐름(About~Certifications)을 먼저 묶고, 보조 콘텐츠인 Archive(글/기록)는
// 그 뒤 Contact 바로 앞에 배치한다 — 탭 순서(TabNav.jsx)와 동일하게 맞춘다.
const SECTION_IDS = ['about', 'skills', 'portfolio', 'certifications', 'archive', 'contact']

// 한 페이지 스크롤 홈 — 탭을 누르면 페이지 이동이 아니라 해당 섹션으로 부드럽게 스크롤된다.
// 지금 보고 있는 섹션은 IntersectionObserver로 추적해 상단 탭 하이라이트에 반영한다.
function Home() {
  const location = useLocation()
  const { setActiveId } = useActiveSection()

  // 다른 라우트(아카이브 전체 목록, 상세/수정 화면 등)에서 "/#section" 형태로 돌아왔을 때 그 섹션으로 스크롤.
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

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
      <Certifications />
      <ArchivePreview />
      <Contact />
    </>
  )
}

export default Home
