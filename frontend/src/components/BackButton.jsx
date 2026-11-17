import { Link } from 'react-router-dom'

// 상세 화면 맨 위의 "돌아가기" 아이콘 버튼 — 글자 대신 화살표 그림 하나로 보여 준다.
// 누르면 목록(또는 홈의 그 섹션)으로 돌아가고, 보던 스크롤 위치를 복원한다. 설명은 툴팁/스크린리더용 label.
function BackButton({ to, label }) {
  return (
    <Link to={to} state={{ restoreScroll: true }} className="back-btn" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  )
}

export default BackButton
