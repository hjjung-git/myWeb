import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

// 홈 화면의 "Experience / Projects" 섹션 — 경력(타임라인)과 프로젝트(카드)를 나눠서 보여준다.
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

  return (
    <div id="portfolio">
      {isAdmin && (
        <div className="list-toolbar">
          <Link to="/portfolio/new" className="btn-primary">
            + 새 항목 추가
          </Link>
        </div>
      )}

      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && loading && <p className="status">불러오는 중...</p>}
      {!error && !loading && isEmpty && <p className="status">아직 등록된 프로젝트/경력이 없습니다.</p>}

      {!error && experience?.length > 0 && (
        <section className="portfolio-section">
          <p className="eyebrow">Experience</p>
          <h2 className="section-title">실무 경험</h2>
          <div className="timeline">
            {experience.map((item) => (
              <div key={item.id} className="tl-item">
                <Link to={`/portfolio/${item.id}`}>
                  <div className="tl-date">{item.periodText || ' '}</div>
                  <div className="tl-body">
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {!error && projects?.length > 0 && (
        <section className="portfolio-section">
          <p className="eyebrow">Projects</p>
          <h2 className="section-title">프로젝트</h2>
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
