import { useLocation } from 'react-router-dom'

// 화면 맨 아래에 작게 놓는 연락처 줄 — 별도 탭/섹션 없이 내비게이션처럼 한 줄로 둔다.
// Archive 화면은 왼쪽 카테고리 트리 레이아웃이라 여기서는 숨긴다.
function SiteFooter() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/archive')) return null

  return (
    <footer className="site-footer">
      <nav className="footer-contact" aria-label="연락처">
        <span className="footer-label">Contact</span>
        <a href="mailto:jaeroj9@gmail.com">jaeroj9@gmail.com</a>
        <a href="tel:+821092851019">010-9285-1019</a>
        <a href="https://github.com/hjjung-git" target="_blank" rel="noreferrer">
          github.com/hjjung-git
        </a>
      </nav>
    </footer>
  )
}

export default SiteFooter
