import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { fetchExperienceWithDetail, fetchProjectsWithTech } from '../lib/portfolioApi.js'
import ProjectCard from '../components/ProjectCard.jsx'
import SectionHead from '../components/SectionHead.jsx'
import SectionPage from '../components/SectionPage.jsx'

const OVERVIEW_PROJECTS = 6

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
    // 기술 스택은 목록(요약)에 없어서 상세를 한 번씩 더 받는다 — 전체 페이지의 카드와 홈 개요 패널(많이 쓴 기술)이 쓴다.
    const loadProjects = fetchProjectsWithTech()
    Promise.all([
      wantExperience ? fetchExperienceWithDetail() : Promise.resolve([]),
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

  // 경력 — 상세 페이지로 보내지 않고, 가로로 넓은 카드에 내용을 바로 펼쳐 보인다.
  const experienceContent = (
    <>
      {isAdmin && (
        <div className="list-toolbar">
          <Link to="/portfolio/new?type=EXPERIENCE" className="btn-primary">
            + 경력 추가
          </Link>
        </div>
      )}
      <div className="career-list">
        {experience?.map((item) => {
          const meta = [item.employmentType, item.department, item.jobRank].filter(Boolean)
          return (
            <article key={item.id} className="career-card">
              <div className="cc-period">{item.periodText || ' '}</div>
              <div className="cc-body">
                <h3>{item.title}</h3>
                {meta.length > 0 && (
                  <p className="cc-meta">{meta.map((m) => <span key={m} className="tag">{m}</span>)}</p>
                )}
                {item.detailContent && <p className="cc-desc">{item.detailContent}</p>}
              </div>
              {isAdmin && <Link to={`/portfolio/${item.id}/edit`} className="cc-edit">수정</Link>}
            </article>
          )
        })}
      </div>
    </>
  )

  const projectsContent = (
    <>
      {isAdmin && (
        <div className="list-toolbar">
          <Link to="/portfolio/new" className="btn-primary">
            + 프로젝트 추가
          </Link>
        </div>
      )}
      <ul className="project-grid pc-grid">
        {shownProjects?.map((item) => (
          <ProjectCard key={item.id} item={item} showTech={full} />
        ))}
      </ul>
    </>
  )

  const status = (
    <>
      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && loading && <p className="status">불러오는 중...</p>}
      {loaded && isEmpty && !isAdmin && (
        <p className="status">
          아직 등록된 {part === 'career' ? '경력이' : part === 'projects' ? '프로젝트가' : '프로젝트/경력이'} 없습니다.
        </p>
      )}
    </>
  )

  // 전체 페이지(/portfolio) — 프로젝트만 보여 준다.
  if (full) {
    return (
      <SectionPage id={part === 'career' ? 'career' : 'projects'} eyebrow={part === 'career' ? 'Career' : 'Projects'} title={part === 'career' ? '경력 사항' : '프로젝트'}>
        {status}
        {showExperience && (
          <section className="page-block">
            <h2 className="block-title">경력 사항</h2>
            {experienceContent}
          </section>
        )}
        {showProjects && (
          <section className="page-block">
            <h2 className="block-title">프로젝트</h2>
            {projectsContent}
          </section>
        )}
      </SectionPage>
    )
  }

  // 홈 — 경력은 가로 카드, 프로젝트는 썸네일 카드
  return (
    <div id={part === 'career' ? 'career' : 'projects'}>
      {status}
      {showExperience && (
        <section className="portfolio-section">
          <SectionHead eyebrow="Career" title="경력 사항" />
          {experienceContent}
        </section>
      )}
      {showProjects && (
        <section className="portfolio-section">
          <SectionHead eyebrow="Projects" title="프로젝트" to="/portfolio" />
          {projectsContent}
        </section>
      )}
    </div>
  )
}

export default PortfolioList
