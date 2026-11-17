import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPortfolioChoices, splitTech } from '../lib/portfolioApi.js'

// Archive 글 상세에서 이 글이 이어진 포트폴리오(기술·프로젝트)를 칩으로 보여준다. 누르면 해당 화면으로 간다.
// 지워진 프로젝트의 id는 목록에 없으니 자동으로 빠진다.
function PostRelations({ post }) {
  const [choices, setChoices] = useState([])
  const skills = splitTech(post.relatedSkills)
  const ids = splitTech(post.relatedProjectIds)

  useEffect(() => {
    if (ids.length === 0) return
    fetchPortfolioChoices().then(setChoices).catch(() => setChoices([]))
  }, [post.relatedProjectIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const projects = ids.map((id) => choices.find((c) => c.id === id)).filter(Boolean)
  if (skills.length === 0 && projects.length === 0) return null

  return (
    <aside className="post-relations" aria-label="이 글과 연결된 포트폴리오">
      {skills.length > 0 && (
        <p>
          <span className="post-relations-label">기술</span>
          {skills.map((name) => (
            <Link key={name} className="tag tag-link" to={`/skills?skill=${encodeURIComponent(name)}`}>{name}</Link>
          ))}
        </p>
      )}
      {projects.length > 0 && (
        <p>
          <span className="post-relations-label">프로젝트</span>
          {projects.map((p) => (
            <Link key={p.id} className="tag tag-link" to={`/portfolio/${p.id}`}>{p.title}</Link>
          ))}
        </p>
      )}
    </aside>
  )
}

export default PostRelations
