const GROUPS = [
  {
    name: 'RDBMS & Cloud',
    tags: ['AWS RDS MySQL', 'MySQL', 'CI/CD', '백업/복구', '보안 설정'],
  },
  {
    name: 'Graph DB & Ontology',
    tags: ['Neo4j', 'Cypher', 'APOC', '온톨로지 설계', 'RDF/OWL (학습중)'],
  },
  {
    name: 'FDE Focus',
    tags: ['낯선 도메인 빠른 학습', '민감 데이터 취급', '요구사항 → 데이터 모델링'],
  },
  {
    name: 'AI 활용',
    tags: ['오케스트레이션 자동화', '에이전트 가드레일', 'Human-in-the-loop 설계', '병렬 개발 (git worktree)'],
  },
  {
    name: 'Language',
    tags: ['Python', 'Java', 'JavaScript', 'SQL', 'Cypher', 'RDF/OWL', 'C/C++'],
  },
  {
    name: 'OS',
    tags: ['macOS', 'Windows', 'Linux'],
  },
]

function Skills() {
  return (
    <section id="skills" className="portfolio-section">
      <p className="eyebrow">Skills</p>
      <h2 className="section-title">기술 스택</h2>
      <div className="skill-groups">
        {GROUPS.map((group) => (
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

export default Skills
