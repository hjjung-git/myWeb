import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { postsForProject } from '../lib/portfolioApi.js'

// 프로젝트·경력 상세 아래 — 이 항목을 '관련 프로젝트'로 고른 Archive 글 목록. 없으면 아무것도 안 그린다.
function RelatedPosts({ projectId }) {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    apiGet('/api/posts/index')
      .then((all) => setPosts(postsForProject(projectId, all)))
      .catch(() => setPosts([]))
  }, [projectId])
  if (posts.length === 0) return null
  return (
    <section className="related-posts" aria-label="관련 Archive 글">
      <h2 className="block-title">관련 Archive 글</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/archive/${post.id}`}>
              <span className="related-post-title">{post.title}</span>
              <span className="related-post-path">{[post.category, post.subcategory, post.minorCategory].filter(Boolean).join(' › ')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RelatedPosts
