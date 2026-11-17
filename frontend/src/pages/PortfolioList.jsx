import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { fetchProjectsWithTech, splitTech } from '../lib/portfolioApi.js'
import SectionHead from '../components/SectionHead.jsx'
import SectionPage from '../components/SectionPage.jsx'

const OVERVIEW_PROJECTS = 3

// 경력(Career)과 프로젝트(Projects) — 홈에서는 각각 별도 섹션/탭이다(part="career" | "projects").
// 홈의 Projects는 몇 개만 보여 주고, /portfolio(전체 페이지, part="projects")에서는 프로젝트 전체를 보여 준다.
// 전체 페이지의 프로젝트 카드는 기술 스택까지 보여준다. 각 항목의 자세한 내용은 상세 페이지(/portfolio/:id).
function PortfolioList({ full = false, part }) {
  const wantExperience = part !== 'projects'
  const wantProjects = part !== 'career'
  const { isAdmin } = useAuth()
  const [experience, setExperience] = useState(null)
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 전체 페이지는 기술 스택이 필요해서 상세를 한 번씩 더 받는다.
    const loadProjects = full ? fetchProjectsWithTech() : apiGet('/api/portfolio-items?type=PROJECT')
    Promise.all([
      wantExperience ? apiGet('/api/portfolio-items?type=EXPERIENCE') : Promise.resolve([]),
      wantProjects ? loadProjects : Promise.resolve([]),
    ])
      .then(([exp, proj]) => {
        setExperience(exp)
        setProjects(proj)
      })
      .catch((err) => setError(err.message))
  }, [full, wantExperience, wantProjects])

  const loading = experience === null && projects === null && !error
  const isEmpty = experience?.length === 0 && projects?.length === 0

  // 관리자는 항목이 하나도 없어도 각 섹션과 추가 버튼이 보여야 처음 추가할 수 있다.
  const loaded = !error && !loading
  const showExperience = loaded && wantExperience && (experience?.length > 0 || isAdmin)
  const showProjects = loaded && wantProjects && (projects?.length > 0 || isAdmin)
  const shownProjects = full ? projects : projects?.slice(0, OVERVIEW_PROJECTS)

  const body = (
    <>
      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && loading && <p className="status">불러오는 중...</p>}
      {loaded && isEmpty && !isAdmin && (
        <p className="status">
          아직 등록된 {part === 'career' ? '경력이' : part === 'projects' ? '프로젝트가' : '프로젝트/경력이'} 없습니다.
        </p>
      )}

      {showExperience && (
        <section className={full ? 'page-block' : 'portfolio-section'}>
          {full ? (
            <h2 className="block-title">경력 사항</h2>
          ) : (
            <SectionHead eyebrow="Career" title="경력 사항" />
          )}
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
        <section className={full ? 'page-block' : 'portfolio-section'}>
          {full ? (
            <h2 className="block-title">프로젝트</h2>
          ) : (
            <SectionHead eyebrow="Projects" title="프로젝트" to="/portfolio" />
          )}
          {isAdmin && (
            <div className="list-toolbar">
              <Link to="/portfolio/new" className="btn-primary">
                + 프로젝트 추가
              </Link>
            </div>
          )}
          <ul className="project-grid">
            {shownProjects.map((item) => (
              <li key={item.id} className="project-card">
                <Link to={`/portfolio/${item.id}`}>
                  <span className="portfolio-type">{item.periodText || '프로젝트'}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  {full && splitTech(item.techStack).length > 0 && (
                    <span className="project-tech">
                      {splitTech(item.techStack).map((tech) => (
                        <span key={tech} className="tag">{tech}</span>
                      ))}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )

  if (full) {
    return (
      <SectionPage id={part === 'career' ? 'career' : 'projects'} eyebrow={part === 'career' ? 'Career' : 'Projects'} title={part === 'career' ? '경력 사항' : '프로젝트'}>
        {body}
      </SectionPage>
    )
  }
  return <div id={part === 'career' ? 'career' : 'projects'}>{body}</div>
}

export default PortfolioList
