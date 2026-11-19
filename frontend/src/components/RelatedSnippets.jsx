import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { snippetsForProject } from '../lib/codebase.js'

// 프로젝트·경력 상세 아래 — 이 항목을 '관련 프로젝트'로 고른 Codebase 코드 글 목록. 없으면 아무것도 안 그린다.
function RelatedSnippets({ projectId }) {
  const [snippets, setSnippets] = useState([])
  useEffect(() => {
    apiGet('/api/snippets')
      .then((all) => setSnippets(snippetsForProject(projectId, all)))
      .catch(() => setSnippets([]))
  }, [projectId])
  if (snippets.length === 0) return null
  return (
    <section className="related-posts" aria-label="관련 Codebase 코드">
      <h2 className="block-title">관련 Codebase 코드</h2>
      <ul>
        {snippets.map((s) => (
          <li key={s.id}>
            <Link to={`/codebase/${s.id}`}>
              <span className="related-post-title">{s.title}</span>
              <span className="related-post-path">{[(s.languages ?? []).join(', '), s.description].filter(Boolean).join(' · ')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RelatedSnippets
