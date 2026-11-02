import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

// 홈 화면의 "Career / Projects" 섹션 — 경력 사항(타임라인: 회사명 + 재직 기간만)과 프로젝트(카드)를 나눠서 보여준다.
// 각 항목은 요약 정보만 받아오고, 상세가 필요하면 상세 페이지(별도 라우트)로 이동한다.
function PortfolioList() {
  const { isAdmin } = useAuth()
  const [experience, setExperience] = useState(null)
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      apiGet('/api/portfolio-items?type=EXPERIENCE'),
      apiGet('/api/portfolio-items?type=PROJECT'),
    ])
      .then(([exp, proj]) => {
        setExperience(exp)
        setProjects(proj)
      })
      .catch((err) => setError(err.message))
  }, [])

  const loading = experience === null && projects === null && !error
  const isEmpty = experience?.length === 0 && projects?.length === 0

  // 관리자는 항목이 하나도 없어도 각 섹션과 추가 버튼이 보여야 처음 추가할 수 있다.
  const loaded = !error && !loading
  const showExperience = loaded && (experience?.length > 0 || isAdmin)
  const showProjects = loaded && (projects?.length > 0 || isAdmin)

  return (
    <div id="portfolio">
      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && loading && <p className="status">불러오는 중...</p>}
      {loaded && isEmpty && !isAdmin && <p className="status">아직 등록된 프로젝트/경력이 없습니다.</p>}

      {showExperience && (
        <section className="portfolio-section">
          <p className="eyebrow">Career</p>
          <h2 className="section-title">경력 사항</h2>
          {isAdmin && (
            <div className="list-toolbar">
              <Link to="/portfolio/new?type=EXPERIENCE" className="btn-primary">
                + 경력 추가
              </Link>
            </div>
          )}
          <div className="timeline">
            {experience.map((item) => (
              <div key={item.id} className="tl-item">
                <Link to={`/portfolio/${item.id}`}>
                  <div className="tl-date">{item.periodText || ' '}</div>
                  <div className="tl-body">
                    <h3>{item.title}</h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {showProjects && (
        <section className="portfolio-section">
          <p className="eyebrow">Projects</p>
          <h2 className="section-title">프로젝트</h2>
          {isAdmin && (
            <div className="list-toolbar">
              <Link to="/portfolio/new" className="btn-primary">
                + 프로젝트 추가
              </Link>
            </div>
          )}
          <ul className="project-grid">
            {projects.map((item) => (
              <li key={item.id} className="project-card">
                <Link to={`/portfolio/${item.id}`}>
                  <span className="portfolio-type">{item.periodText || '프로젝트'}</span>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default PortfolioList
