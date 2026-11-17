import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SectionHead from '../components/SectionHead.jsx'
import SectionPage from '../components/SectionPage.jsx'
import { EVIDENCE, SKILL_GROUPS } from '../lib/skillsData.js'
import RelationGraph from '../components/RelationGraph.jsx'
import { apiGet } from '../lib/api.js'
import { fetchProjectsWithTech, postsAbout, projectsUsing } from '../lib/portfolioApi.js'

// 홈에서는 기술 목록만(Overview), /skills 에서는 기술마다 "어디서 썼는지"를 함께 보여준다.
// 연결은 프로젝트의 기술 스택 태그와 같은 이름이면 자동 — 새 프로젝트를 추가하면 여기도 따라 바뀐다.
function Skills({ full = false }) {
  const [projects, setProjects] = useState(null)
  const [posts, setPosts] = useState([])
  const [searchParams] = useSearchParams()
  // Archive 글의 기술 칩에서 넘어오면(/skills?skill=Neo4j) 그 기술이 미리 선택돼 있다.
  const [selected, setSelected] = useState(() => (full ? searchParams.get('skill') : null))
  const [view, setView] = useState('list') // 'list' | 'graph'

  useEffect(() => {
    fetchProjectsWithTech().then(setProjects).catch(() => setProjects([]))
    apiGet('/api/posts/index').then(setPosts).catch(() => setPosts([]))
  }, [])

  const usage = useMemo(() => {
    const map = new Map()
    if (!projects) return map
    SKILL_GROUPS.forEach((group) =>
      group.tags.forEach((tag) => map.set(tag, projectsUsing(tag, projects))),
    )
    return map
  }, [projects])

  const postUsage = useMemo(() => {
    const map = new Map()
    SKILL_GROUPS.forEach((group) => group.tags.forEach((tag) => map.set(tag, postsAbout(tag, posts))))
    return map
  }, [posts])

  const viewSwitch = (
    <div className="view-switch" role="group" aria-label="보기 방식">
      <button type="button" className={view === 'list' ? 'is-on' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>목록</button>
      <button type="button" className={view === 'graph' ? 'is-on' : ''} aria-pressed={view === 'graph'} onClick={() => setView('graph')}>관계 보기</button>
    </div>
  )
  const graphView = (
    <>
      {view === 'graph' && projects !== null && (
        <>
          <RelationGraph groups={SKILL_GROUPS} usage={usage} postUsage={postUsage} projects={projects} posts={posts} selected={selected} onSelect={setSelected} />
          <p className="status rel-graph-narrow">관계 그림은 화면이 넓을 때 보입니다. 아래 목록에서 기술을 눌러 확인하세요.</p>
        </>
      )}
      {view === 'graph' && projects === null && <p className="status">불러오는 중...</p>}
    </>
  )

  if (!full) {
    return (
      <section id="skills" className="portfolio-section">
        <SectionHead eyebrow="Skills" title="기술 스택" to="/skills" linkLabel="기술별 경험 보기 →" />
        {viewSwitch}
        {graphView}
        <div className={`skill-groups${view === 'graph' ? ' rel-hide-wide' : ''}`}>
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
  const relatedPosts = selected ? postUsage.get(selected) ?? [] : []
  const evidence = selected ? EVIDENCE[selected] : null

  return (
    <SectionPage
      id="skills"
      eyebrow="Skills"
      title="기술 스택"
      lede="기술을 누르면 그 기술을 어디서 어떻게 썼는지 볼 수 있습니다."
    >
      {viewSwitch}
      {graphView}

      <div className={`skill-groups${view === 'graph' ? ' rel-hide-wide' : ''}`}>
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
          {relatedPosts.length > 0 && (
            <>
              <h3 className="skill-detail-sub">관련 Archive 글</h3>
              <ul className="skill-projects">
                {relatedPosts.slice(0, 8).map((post) => (
                  <li key={post.id}>
                    <Link to={`/archive/${post.id}`}>
                      <span className="skill-project-title">{post.title}</span>
                      <span className="skill-project-summary">{[post.category, post.subcategory, post.minorCategory].filter(Boolean).join(' › ')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {projects !== null && used.length === 0 && relatedPosts.length === 0 && !evidence && (
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
