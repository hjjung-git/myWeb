import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import { ActiveSectionProvider } from './lib/ActiveSectionContext.jsx'
import AdminToggle from './components/AdminToggle.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import TabNav from './components/TabNav.jsx'
import Home from './pages/Home.jsx'
import PortfolioDetail from './pages/PortfolioDetail.jsx'
import PortfolioForm from './pages/PortfolioForm.jsx'
import ArchiveList from './pages/ArchiveList.jsx'
import ArchiveDetail from './pages/ArchiveDetail.jsx'
import ArchiveForm from './pages/ArchiveForm.jsx'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ActiveSectionProvider>
          <div className="site">
            <header className="site-header">
              <Link to="/" className="brand">myWeb</Link>
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
                <Route path="/archive" element={<ArchiveList />} />
                <Route path="/archive/new" element={<ArchiveForm />} />
                <Route path="/archive/:id" element={<ArchiveDetail />} />
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
