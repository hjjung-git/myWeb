import { Link } from 'react-router-dom'

// 홈(Overview)의 섹션 머리 — 제목 오른쪽에 그 영역의 전용 페이지로 가는 "전체 보기" 링크를 둔다.
function SectionHead({ eyebrow, title, to, linkLabel = '전체 보기 →' }) {
  return (
    <div className="overview-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="overview-link">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

export default SectionHead
