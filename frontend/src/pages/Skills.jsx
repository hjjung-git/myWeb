import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SectionPage from '../components/SectionPage.jsx'
import { EVIDENCE, SKILL_GROUPS } from '../lib/skillsData.js'
import RelationGraph from '../components/RelationGraph.jsx'
import SectionHead from '../components/SectionHead.jsx'
import SkillBars from '../components/SkillBars.jsx'
import SkillLevelEditor from '../components/SkillLevelEditor.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { buildSkillRows, pickCore } from '../lib/skillLevel.js'
import { apiGet } from '../lib/api.js'
import { fetchProjectsWithTech, postsAbout, projectsUsing } from '../lib/portfolioApi.js'
import { snippetsAbout } from '../lib/codebase.js'

// 홈에서는 기술 목록만(Overview), /skills 에서는 기술마다 "어디서 썼는지"를 함께 보여준다.
// 연결은 프로젝트의 기술 스택 태그와 같은 이름이면 자동 — 새 프로젝트를 추가하면 여기도 따라 바뀐다.
function Skills({ full = false }) {
  const [projects, setProjects] = useState(null)
  const { isAdmin } = useAuth()
  const [posts, setPosts] = useState([])
  const [snippets, setSnippets] = useState([]) // Codebase 코드 글 — 막대(적응형 레벨)와 관계에 쓴다
  const [levels, setLevels] = useState(() => new Map()) // 관리자가 정한 내 숙련도·핵심 기술
  const [levelsReady, setLevelsReady] = useState(false) // 편집기는 저장된 값을 다 불러온 뒤에 연다(초기값이 그 값으로 잡히도록)
  const [searchParams] = useSearchParams()
  // Archive 글의 기술 칩에서 넘어오면(/skills?skill=Neo4j) 그 기술이 미리 선택돼 있다.
  const [selected, setSelected] = useState(() => (full ? searchParams.get('skill') : null))
  const [view, setView] = useState(() => (searchParams.get('view') === 'graph' ? 'graph' : 'list')) // 'list' | 'graph'

  useEffect(() => {
    fetchProjectsWithTech().then(setProjects).catch(() => setProjects([]))
    apiGet('/api/posts/index').then(setPosts).catch(() => setPosts([]))
    apiGet('/api/snippets').then(setSnippets).catch(() => setSnippets([]))
    apiGet('/api/skill-levels')
      .then((list) => setLevels(new Map(list.map((l) => [l.name, l]))))
      .catch(() => setLevels(new Map()))
      .finally(() => setLevelsReady(true))
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

  // 기술 막대 — 채움은 글·코드·프로젝트 수로 자동, 눈금은 관리자가 정한 값
  const rows = useMemo(
    () => buildSkillRows(SKILL_GROUPS, { projects: projects ?? [], posts, snippets, levels }),
    [projects, posts, snippets, levels],
  )

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

  // 홈 — 핵심 기술만 막대로. 세부 기술·관계 보기는 /skills.
  if (!full) {
    return (
      <section id="skills" className="portfolio-section">
        <SectionHead eyebrow="Skills" title="기술 스택" to="/skills?view=graph" linkLabel="세부 기술 · 관계 보기 →" />
        {projects === null ? <p className="status">불러오는 중...</p> : <SkillBars rows={pickCore(rows)} />}
      </section>
    )
  }

  const used = selected ? usage.get(selected) ?? [] : []
  const relatedPosts = selected ? postUsage.get(selected) ?? [] : []
  const relatedSnippets = selected ? snippetsAbout(selected, snippets) : []
  const evidence = selected ? EVIDENCE[selected] : null

  return (
    <SectionPage
      id="skills"
      eyebrow="Skills"
      title="기술 스택"
      lede="기술을 누르면 그 기술을 어디서 어떻게 썼는지 볼 수 있습니다."
    >
      {projects !== null && (
        <section className="skill-level-block">
          <h2 className="block-title">핵심 기술 레벨</h2>
          <SkillBars rows={pickCore(rows)} />
        </section>
      )}
      {isAdmin && projects !== null && levelsReady && (
        <SkillLevelEditor
          groups={SKILL_GROUPS}
          rows={rows}
          onSaved={(list) => setLevels(new Map(list.map((l) => [l.name, l])))}
        />
      )}

      <h2 className="block-title">세부 기술</h2>
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
          {relatedSnippets.length > 0 && (
            <>
              <h3 className="skill-detail-sub">관련 Codebase 코드</h3>
              <ul className="skill-projects">
                {relatedSnippets.slice(0, 8).map((sn) => (
                  <li key={sn.id}>
                    <Link to={`/codebase/${sn.id}`}>
                      <span className="skill-project-title">{sn.title}</span>
                      <span className="skill-project-summary">{[sn.language, sn.description].filter(Boolean).join(' · ')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {projects !== null && used.length === 0 && relatedPosts.length === 0 && relatedSnippets.length === 0 && !evidence && (
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
