import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 아카이브(글/기록) 목록. 과거엔 매매일지(TRADE_LOG) 타입도 같은 도메인에 있었으나,
// 백엔드 레거시 정리 때 그 기능 자체가 완전히 삭제되어 이제 Post는 단일 글 모델이다.
// 백엔드가 Page 응답(Spring Data)을 그대로 주기 때문에 content/totalPages/number를 그대로 쓴다.
function ArchiveList() {
  const { isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || 0)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(null)
    apiGet(`/api/posts?page=${page}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [page])

  function goToPage(p) {
    setSearchParams(p === 0 ? {} : { page: String(p) })
  }

  return (
    <section className="portfolio-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Archive</p>
          <h2 className="section-title">기록</h2>
        </div>
        {isAdmin && (
          <Link to="/archive/new" className="btn-primary">+ 새 글 작성</Link>
        )}
      </div>

      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && !data && <p className="status">불러오는 중...</p>}
      {!error && data && data.content.length === 0 && <p className="status">아직 작성된 글이 없습니다.</p>}

      {!error && data && data.content.length > 0 && (
        <>
          <ul className="post-list">
            {data.content.map((post) => (
              <li key={post.id} className="post-row">
                <Link to={`/archive/${post.id}`}>
                  <span className="post-title">{post.title}</span>
                  <span className="post-meta">{formatDate(post.lastModifiedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <div className="pagination">
              <button type="button" className="btn-secondary" disabled={page === 0} onClick={() => goToPage(page - 1)}>
                ← 이전
              </button>
              <span className="page-indicator">{page + 1} / {data.totalPages}</span>
              <button
                type="button"
                className="btn-secondary"
                disabled={page >= data.totalPages - 1}
                onClick={() => goToPage(page + 1)}
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default ArchiveList
