// 포트폴리오(홈)의 섹션 목록 — 상단 탭(TabNav)과 플로팅 메뉴(FloatingNav)가 같이 쓴다. 홈의 섹션 id와 같아야 한다.
export const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'portfolio', label: 'Career / Projects' },
  { id: 'educations', label: '교육' },
  { id: 'certifications', label: '어학 / 자격증' },
  { id: 'contact', label: 'Contact' },
]

// 지금 어느 섹션을 보는 중인가 — 홈에서는 스크롤 위치(activeId), 영역별 전용/상세 페이지에서는 그 페이지의 영역.
export function activeSectionFor(pathname, activeId) {
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/skills')) return 'skills'
  if (pathname.startsWith('/portfolio')) return 'portfolio'
  if (pathname.startsWith('/educations')) return 'educations'
  if (pathname.startsWith('/certifications')) return 'certifications'
  return activeId
}
