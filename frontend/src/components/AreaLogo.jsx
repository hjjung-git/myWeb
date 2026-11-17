import { Link } from 'react-router-dom'

// Archive·Codebase의 "홈으로 돌아가기" 로고 — 글자 링크("Archive 홈" 등) 대신 작은 그림 하나.
// 색은 전부 CSS 변수라 라이트/다크 테마를 따른다. (스타일은 App.css의 .area-logo)
const AREAS = {
  archive: { to: '/archive', label: 'Archive 홈으로 이동' },
  codebase: { to: '/codebase', label: 'Codebase 홈으로 이동' },
}

function ArchiveGlyph() {
  // 뿌리에서 세 갈래로 뻗는 지식 트리 (ArchiveMark의 축약판)
  return (
    <>
      <path d="M20 31 C20 24 10 24 10 17 M20 31 L20 13 M20 31 C20 24 30 24 30 17" />
      <circle cx="10" cy="17" r="2.6" />
      <circle cx="20" cy="12" r="2.6" />
      <circle cx="30" cy="17" r="2.6" />
      <circle className="al-root" cx="20" cy="31" r="3.4" />
    </>
  )
}

function CodebaseGlyph() {
  // < / > — 코드
  return (
    <>
      <path d="M14 14 L7 20 L14 26" />
      <path d="M26 14 L33 20 L26 26" />
      <path d="M22.5 11.5 L17.5 28.5" />
    </>
  )
}

function AreaLogo({ area }) {
  const { to, label } = AREAS[area]
  return (
    <Link to={to} className={`area-logo area-logo-${area}`} aria-label={label} title={label}>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <rect className="al-bg" x="1" y="1" width="38" height="38" rx="11" />
        <g className="al-glyph">{area === 'archive' ? <ArchiveGlyph /> : <CodebaseGlyph />}</g>
      </svg>
    </Link>
  )
}

export default AreaLogo
