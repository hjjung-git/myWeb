import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHead from '../components/SectionHead.jsx'
import SectionPage from '../components/SectionPage.jsx'
import { EVIDENCE, SKILL_GROUPS } from '../lib/skillsData.js'
import { fetchProjectsWithTech, projectsUsing } from '../lib/portfolioApi.js'

// 홈에서는 기술 목록만(Overview), /skills 에서는 기술마다 "어디서 썼는지"를 함께 보여준다.
// 연결은 프로젝트의 기술 스택 태그와 같은 이름이면 자동 — 새 프로젝트를 추가하면 여기도 따라 바뀐다.
function Skills({ full = false }) {
  const [projects, setProjects] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!full) return
    fetchProjectsWithTech().then(setProjects).catch(() => setProjects([]))
  }, [full])

  const usage = useMemo(() => {
    const map = new Map()
    if (!projects) return map
    SKILL_GROUPS.forEach((group) =>
      group.tags.forEach((tag) => map.set(tag, projectsUsing(tag, projects))),
    )
    return map
  }, [projects])

  if (!full) {
    return (
      <section id="skills" className="portfolio-section">
        <SectionHead eyebrow="Skills" title="기술 스택" to="/skills" linkLabel="기술별 경험 보기 →" />
        <div className="skill-groups">
          {SKILL_GROUPS.map((group) => (
            <div key={group.name} className="skill-card">
              <h3><span className="dot" />{group.name}</h3>
              <div className="tag-row">
                {group.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const used = selected ? usage.get(selected) ?? [] : []
  const evidence = selected ? EVIDENCE[selected] : null

  return (
    <SectionPage
      id="skills"
      eyebrow="Skills"
      title="기술 스택"
      lede="기술을 누르면 그 기술을 어디서 어떻게 썼는지 볼 수 있습니다."
    >
      <div className="skill-groups">
        {SKILL_GROUPS.map((group) => (
          <div key={group.name} className="skill-card">
            <h3><span className="dot" />{group.name}</h3>
            <div className="tag-row">
              {group.tags.map((tag) => {
                const count = usage.get(tag)?.length ?? 0
                const linked = count > 0 || Boolean(EVIDENCE[tag])
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`tag tag-button${linked ? ' is-linked' : ''}${selected === tag ? ' is-selected' : ''}`}
                    aria-pressed={selected === tag}
                    onClick={() => setSelected(selected === tag ? null : tag)}
                  >
                    {tag}
                    {count > 0 && <span className="tag-count">{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="skill-detail" role="region" aria-label={`${selected} 경험`}>
          <h2>{selected}</h2>
          {evidence && <p className="skill-evidence">{evidence}</p>}
          {projects === null && <p className="status">프로젝트를 불러오는 중...</p>}
          {projects !== null && used.length > 0 && (
            <>
              <h3 className="skill-detail-sub">사용한 프로젝트</h3>
              <ul className="skill-projects">
                {used.map((project) => (
                  <li key={project.id}>
                    <Link to={`/portfolio/${project.id}`}>
                      <span className="skill-project-title">{project.title}</span>
                      <span className="skill-project-summary">{project.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {projects !== null && used.length === 0 && !evidence && (
            <p className="status">
              아직 연결된 경험이 없습니다. 프로젝트의 기술 스택에 같은 이름을 쓰면 자동으로 연결됩니다.
            </p>
          )}
        </div>
      )}
    </SectionPage>
  )
}

export default Skills
