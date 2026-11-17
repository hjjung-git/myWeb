import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSection } from '../lib/ActiveSectionContext.jsx'
import About from './About.jsx'
import Skills from './Skills.jsx'
import PortfolioList from './PortfolioList.jsx'
import Educations from './Educations.jsx'
import Certifications from './Certifications.jsx'

// 이력/커리어 흐름(About~Educations~Certifications) — 탭 순서(lib/sections.js)와 동일하게 맞춘다.
// Archive는 홈의 섹션이 아니라 별도 화면(/archive)이다. 연락처는 화면 맨 아래 SiteFooter에 있다.
const SECTION_IDS = ['about', 'skills', 'portfolio', 'educations', 'certifications']

// 한 페이지 스크롤 홈 — 탭을 누르면 페이지 이동이 아니라 해당 섹션으로 부드럽게 스크롤된다.
// 지금 보고 있는 섹션은 스크롤 위치로 계산해 상단 탭 하이라이트에 반영한다.
//  · 화면 위에서 40% 지점을 지난 섹션 중 가장 아래 것을 현재 섹션으로 본다.
//  · 페이지 맨 아래에 닿으면 마지막 섹션으로 본다. (마지막 섹션들은 짧아서 시작 위치가 그 지점까지 못 올라오기 때문)
function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setActiveId, getPin, clearPin } = useActiveSection()

  // "/#section"으로 들어왔을 때의 스크롤과, 상세 화면에서 돌아왔을 때의 위치 복원은 ScrollManager가 맡는다.
  // 여기서는 예전 링크(/#archive)만 Archive 목록으로 보낸다.
  useEffect(() => {
    if (location.hash === '#archive') navigate('/archive', { replace: true })
  }, [location.hash, navigate])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const pinned = getPin()
      if (pinned) {
        setActiveId(pinned)
        return
      }
      const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean)
      if (elements.length === 0) return
      const root = document.documentElement
      const scrollable = root.scrollHeight > window.innerHeight + 8
      const atBottom = scrollable && window.scrollY > 0 && window.innerHeight + window.scrollY >= root.scrollHeight - 4
      let current = elements[0]
      if (atBottom) {
        current = elements[elements.length - 1]
      } else {
        const line = window.innerHeight * 0.4
        elements.forEach((el) => {
          if (el.getBoundingClientRect().top <= line) current = el
        })
      }
      setActiveId(current.id)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // 사용자가 직접 스크롤·키 입력·클릭을 하면 탭으로 고른 표시를 풀고 스크롤 위치를 따른다.
    const release = () => {
      clearPin()
      schedule()
    }
    const releaseEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown']
    releaseEvents.forEach((ev) => window.addEventListener(ev, release, { passive: true }))
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // 목록 데이터가 늦게 그려져 페이지 길이가 바뀌어도 다시 계산한다.
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(document.body)
    update()
    return () => {
      cancelAnimationFrame(frame)
      releaseEvents.forEach((ev) => window.removeEventListener(ev, release))
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resizeObserver.disconnect()
    }
  }, [setActiveId, getPin, clearPin])

  return (
    <>
      <About />
      <Skills />
      <PortfolioList />
      <Educations />
      <Certifications />
    </>
  )
}

export default Home
