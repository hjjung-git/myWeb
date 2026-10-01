import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const PREVIEW_COUNT = 5

// 홈 화면에 들어가는 아카이브(글/기록) 미리보기 — 최신 글 5개만 보여주고, 전체 목록/페이지네이션은
// "더보기" 버튼을 눌렀을 때만 별도 화면(/archive)으로 이동해서 보여준다.
function ArchivePreview() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiGet('/api/posts?page=0')
      .then((data) => setPosts(data.content.slice(0, PREVIEW_COUNT)))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section id="archive" className="portfolio-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Archive</p>
          <h2 className="section-title">기록</h2>
        </div>
        <Link to="/archive" className="btn-secondary">더보기 →</Link>
      </div>

      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && posts === null && <p className="status">불러오는 중...</p>}
      {!error && posts?.length === 0 && <p className="status">아직 작성된 글이 없습니다.</p>}

      {!error && posts?.length > 0 && (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.id} className="post-row">
              <Link to={`/archive/${post.id}`}>
                <span className="post-title">{post.title}</span>
                <span className="post-meta">{formatDate(post.lastModifiedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ArchivePreview
