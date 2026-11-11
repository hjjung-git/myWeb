import { Link } from 'react-router-dom'

// 영역별 전용 페이지(/skills, /portfolio …)의 공통 틀 — 위에 "← Overview" 링크, 아래로 제목과 내용.
// 돌아가면 홈에서 보던 그 섹션 자리로 간다.
function SectionPage({ id, eyebrow, title, lede, children }) {
  return (
    <div className="section-page">
      <Link to={`/#${id}`} state={{ restoreScroll: true }} className="back-link">
        ← Overview
      </Link>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="section-title section-page-title">{title}</h1>
      {lede && <p className="lede section-page-lede">{lede}</p>}
      {children}
    </div>
  )
}

export default SectionPage
