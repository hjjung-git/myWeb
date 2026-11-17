import { useEffect, useLayoutEffect, useRef } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import { ActiveSectionProvider } from './lib/ActiveSectionContext.jsx'
import SettingsMenu from './components/SettingsMenu.jsx'
import FloatingNav from './components/FloatingNav.jsx'
import TabNav from './components/TabNav.jsx'
import SiteSwitch from './components/SiteSwitch.jsx'
import AreaLogo from './components/AreaLogo.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import ScrollManager from './components/ScrollManager.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Skills from './pages/Skills.jsx'
import PortfolioList from './pages/PortfolioList.jsx'
import Educations from './pages/Educations.jsx'
import Certifications from './pages/Certifications.jsx'
import PortfolioDetail from './pages/PortfolioDetail.jsx'
import PortfolioForm from './pages/PortfolioForm.jsx'
import CertificationDetail from './pages/CertificationDetail.jsx'
import CertificationForm from './pages/CertificationForm.jsx'
import EducationDetail from './pages/EducationDetail.jsx'
import EducationForm from './pages/EducationForm.jsx'
import ArchiveLayout from './pages/ArchiveLayout.jsx'
import ArchiveHome from './pages/ArchiveHome.jsx'
import ArchiveDetail from './pages/ArchiveDetail.jsx'
import ArchiveForm from './pages/ArchiveForm.jsx'
import CodebaseHome from './pages/CodebaseHome.jsx'
import CodebaseDetail from './pages/CodebaseDetail.jsx'
import CodebaseForm from './pages/CodebaseForm.jsx'
import './App.css'

// 주소의 깊이 — "/"=0, "/archive"·"/portfolio"=1, "/portfolio/3"·"/archive/new"=2 …
// 깊어지면 "들어간다"(확대되며 나타남), 얕아지면 "돌아온다"(축소되며 제자리로)로 보고 html에 표시해 둔다(CSS가 이걸로 애니메이션을 고른다).
const depthOf = (pathname) => pathname.split('/').filter(Boolean).length

function App() {
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  useLayoutEffect(() => {
    const before = depthOf(prevPath.current)
    const after = depthOf(location.pathname)
    document.documentElement.dataset.nav = after > before ? 'forward' : after < before ? 'back' : 'same'
    prevPath.current = location.pathname
  }, [location.pathname])

  // 헤더 높이를 CSS 변수로 알려 준다 — 메인 화면이 "헤더를 뺀 화면 전체"를 딱 채우도록 (창 크기가 바뀌어도 따라감).
  useEffect(() => {
    const header = document.querySelector('.site-header')
    if (!header) return undefined
    const sync = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  // 스크롤바를 뺀 화면 폭을 --vw로 알려 준다 — 화면 전체 폭으로 펼치는 곳(메인 첫 화면, Archive)이
  // 스크롤바 폭(100vw에는 포함됨)만큼 오른쪽으로 치우치지 않게 한다.
  useEffect(() => {
    const root = document.documentElement
    const sync = () => root.style.setProperty('--vw', `${root.clientWidth}px`)
    sync()
    window.addEventListener('resize', sync)
    const observer = new ResizeObserver(sync)
    observer.observe(root)
    return () => {
      window.removeEventListener('resize', sync)
      observer.disconnect()
    }
  }, [])

  const areaName = location.pathname.startsWith('/archive') ? 'archive' : location.pathname.startsWith('/codebase') ? 'codebase' : null

  return (
    <ThemeProvider>
      <AuthProvider>
        <ActiveSectionProvider>
          <ScrollManager />
          <div className="site" data-home={location.pathname === '/' ? '' : undefined}>
            <header className="site-header">
              <div className="header-left">
                <Link to="/" className="brand">myWeb</Link>
                <SiteSwitch />
                {/* Archive·Codebase에서는 같은 자리(헤더)에 그 영역 홈으로 가는 로고 */}
                {areaName && <AreaLogo area={areaName} />}
              </div>
              <TabNav />
              <div className="header-actions">
                <SettingsMenu />
              </div>
            </header>

            <main className={`site-main${location.pathname === '/' || location.pathname.startsWith('/codebase') ? ' site-main--home' : ''}`}>
              <Routes>
                <Route path="/" element={<Home />} />
                {/* 영역별 전용 페이지 — 홈은 각 영역의 Overview, 자세한 내용은 여기 */}
                <Route path="/about" element={<About full />} />
                <Route path="/skills" element={<Skills full />} />
                <Route path="/portfolio" element={<PortfolioList full part="projects" />} />
                <Route path="/portfolio/new" element={<PortfolioForm />} />
                <Route path="/portfolio/:id" element={<PortfolioDetail />} />
                <Route path="/portfolio/:id/edit" element={<PortfolioForm />} />
                <Route path="/educations" element={<Educations full />} />
                <Route path="/educations/new" element={<EducationForm />} />
                <Route path="/educations/:id" element={<EducationDetail />} />
                <Route path="/educations/:id/edit" element={<EducationForm />} />
                <Route path="/certifications" element={<Certifications full />} />
                <Route path="/certifications/new" element={<CertificationForm />} />
                <Route path="/certifications/:id" element={<CertificationDetail />} />
                <Route path="/certifications/:id/edit" element={<CertificationForm />} />
                {/* 첫 화면과 글 보기는 왼쪽 카테고리 트리가 있는 공통 레이아웃 안에서, 작성/수정은 넓은 편집 화면으로 */}
                <Route path="/archive" element={<ArchiveLayout />}>
                  <Route index element={<ArchiveHome />} />
                  <Route path=":id" element={<ArchiveDetail />} />
                </Route>
                <Route path="/archive/new" element={<ArchiveForm />} />
                <Route path="/archive/:id/edit" element={<ArchiveForm />} />
                {/* Codebase — 코드 저장소 */}
                <Route path="/codebase" element={<CodebaseHome />} />
                <Route path="/codebase/new" element={<CodebaseForm />} />
                <Route path="/codebase/:id" element={<CodebaseDetail />} />
                <Route path="/codebase/:id/edit" element={<CodebaseForm />} />
              </Routes>
            </main>
            <SiteFooter />
            <FloatingNav />
          </div>
        </ActiveSectionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
