// 기술 막대 목록 — 채움(기록으로 쌓인 진척, 자동)과 눈금(내가 생각하는 숙련도)을 한 막대에 겹쳐 보여준다.
function SkillBars({ rows }) {
  if (rows.length === 0) return <p className="status">아직 표시할 기술이 없습니다.</p>
  return (
    <>
      <ul className="skill-bars">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="sb-head">
              <span className="sb-name">{r.name}</span>
              <span className="sb-counts">글 {r.counts.posts} · 코드 {r.counts.snippets} · 프로젝트 {r.counts.projects}</span>
            </div>
            <div
              className="sb-track"
              role="meter"
              aria-label={`${r.name} 진척도`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={r.evidence}
              aria-valuetext={`기록 기준 ${r.evidence}%${r.self > 0 ? `, 내 숙련도 ${r.self}%` : ''}`}
            >
              {r.self > r.evidence && <span className="sb-gap" style={{ left: `${r.evidence}%`, width: `${r.self - r.evidence}%` }} />}
              <span className="sb-fill" style={{ width: `${r.evidence}%` }} />
              {r.self > 0 && <span className="sb-target" style={{ left: `${r.self}%` }} title={`내가 생각하는 숙련도 ${r.self}%`} />}
            </div>
          </li>
        ))}
      </ul>
      <p className="sb-legend">
        <span><i className="sb-legend-fill" />채움 — Archive 글·Codebase 코드·프로젝트가 쌓일수록 올라가요</span>
        <span><i className="sb-legend-target" />눈금 — 내가 생각하는 숙련도</span>
      </p>
    </>
  )
}

export default SkillBars
