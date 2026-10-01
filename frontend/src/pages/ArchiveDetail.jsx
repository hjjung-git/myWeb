import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function ArchiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setPost(null)
    setError(null)
    apiGet(`/api/posts/${id}`)
      .then(setPost)
      .catch((err) => setError(err.message))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiMutate(`/api/posts/${id}`, 'DELETE')
      navigate('/archive')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (error) return <p className="status status-error">글을 불러오지 못했습니다. ({error})</p>
  if (!post) return <p className="status">불러오는 중...</p>

  return (
    <article className="portfolio-detail" style={{ padding: 'clamp(28px, 5vw, 44px) 0' }}>
      <Link to="/archive" className="back-link">← 목록으로</Link>

      {isAdmin && (
        <div className="detail-toolbar">
          <Link to={`/archive/${id}/edit`} className="btn-secondary">수정</Link>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
            삭제
          </button>
        </div>
      )}

      <h1>{post.title}</h1>
      <p className="portfolio-period">{post.username} · {formatDate(post.lastModifiedAt)}</p>
      <div className="portfolio-body">{post.content}</div>
    </article>
  )
}

export default ArchiveDetail
