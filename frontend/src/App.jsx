import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import { ActiveSectionProvider } from './lib/ActiveSectionContext.jsx'
import AdminToggle from './components/AdminToggle.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import TabNav from './components/TabNav.jsx'
import SiteSwitch from './components/SiteSwitch.jsx'
import ScrollManager from './components/ScrollManager.jsx'
import Home from './pages/Home.jsx'
import PortfolioDetail from './pages/PortfolioDetail.jsx'
import PortfolioForm from './pages/PortfolioForm.jsx'
import CertificationDetail from './pages/CertificationDetail.jsx'
import CertificationForm from './pages/CertificationForm.jsx'
import ArchiveLayout from './pages/ArchiveLayout.jsx'
import ArchiveList from './pages/ArchiveList.jsx'
import ArchiveDetail from './pages/ArchiveDetail.jsx'
import ArchiveForm from './pages/ArchiveForm.jsx'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ActiveSectionProvider>
          <ScrollManager />
          <div className="site">
            <header className="site-header">
              <div className="header-left">
                <Link to="/" className="brand">myWeb</Link>
                <SiteSwitch />
              </div>
              <TabNav />
              <div className="header-actions">
                <ThemeToggle />
                <AdminToggle />
              </div>
            </header>

            <main className="site-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/portfolio" element={<Navigate to="/#portfolio" replace />} />
                <Route path="/portfolio/new" element={<PortfolioForm />} />
                <Route path="/portfolio/:id" element={<PortfolioDetail />} />
                <Route path="/portfolio/:id/edit" element={<PortfolioForm />} />
                <Route path="/certifications/new" element={<CertificationForm />} />
                <Route path="/certifications/:id" element={<CertificationDetail />} />
                <Route path="/certifications/:id/edit" element={<CertificationForm />} />
                {/* 목록과 글 보기는 왼쪽 카테고리 트리가 있는 공통 레이아웃 안에서, 작성/수정은 넓은 편집 화면으로 */}
                <Route path="/archive" element={<ArchiveLayout />}>
                  <Route index element={<ArchiveList />} />
                  <Route path=":id" element={<ArchiveDetail />} />
                </Route>
                <Route path="/archive/new" element={<ArchiveForm />} />
                <Route path="/archive/:id/edit" element={<ArchiveForm />} />
              </Routes>
            </main>
          </div>
        </ActiveSectionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
