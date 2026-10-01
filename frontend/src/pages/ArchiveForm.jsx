import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

// 아카이브 글 작성/수정 폼. 매매일지(TRADE_LOG) 관련 필드는 백엔드 레거시 정리 때
// 도메인째로 삭제되어 더 이상 존재하지 않는다.
function ArchiveForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isAdmin, loading } = useAuth()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(!isEdit)

  useEffect(() => {
    if (!isEdit) return
    apiGet(`/api/posts/${id}`)
      .then((post) => {
        setTitle(post.title)
        setContent(post.content)
        setReady(true)
      })
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  if (!loading && !isAdmin) {
    return <p className="status status-error">관리자 모드에서만 사용할 수 있습니다.</p>
  }
  if (!ready) return <p className="status">불러오는 중...</p>

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = { title, content }
      const saved = isEdit
        ? await apiMutate(`/api/posts/${id}`, 'PUT', payload)
        : await apiMutate('/api/posts', 'POST', payload)
      navigate(`/archive/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit} style={{ maxWidth: '720px' }}>
      <h1>{isEdit ? '글 수정' : '새 글 작성'}</h1>

      <label>
        제목
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
      </label>

      <label>
        내용
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} required />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {isEdit ? '저장' : '게시'}
        </button>
      </div>
    </form>
  )
}

export default ArchiveForm
