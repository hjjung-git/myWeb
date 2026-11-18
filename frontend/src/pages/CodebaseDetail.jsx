import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { languageColor } from '../lib/github.js'
import BackButton from '../components/BackButton.jsx'
import MarkdownView from '../components/MarkdownView.jsx'
import PostRelations from '../components/PostRelations.jsx'

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
}

function CodebaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [snippet, setSnippet] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setSnippet(null)
    setError(null)
    apiGet(`/api/snippets/${id}`).then(setSnippet).catch((err) => setError(err.message))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiMutate(`/api/snippets/${id}`, 'DELETE')
      navigate('/codebase')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (error) return <p className="status status-error">코드를 불러오지 못했습니다. ({error})</p>
  if (!snippet) return <p className="status">불러오는 중...</p>

  return (
    <article className="portfolio-detail codebase-detail">
      <BackButton to="/codebase" label="Codebase 목록으로 돌아가기" />
      {isAdmin && (
        <div className="detail-toolbar">
          <Link to={`/codebase/${id}/edit`} className="btn-secondary">수정</Link>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>삭제</button>
        </div>
      )}
      <p className="cb-card-lang">
        <i style={{ background: languageColor(snippet.language) }} />
        {snippet.language}{snippet.category ? ` · ${snippet.category}` : ''}
      </p>
      <h1>{snippet.title}</h1>
      {snippet.description && <p className="portfolio-summary">{snippet.description}</p>}
      <p className="portfolio-period">{formatDate(snippet.lastModifiedAt)}</p>
      <PostRelations post={snippet} />
      <MarkdownView>{snippet.content}</MarkdownView>
    </article>
  )
}

export default CodebaseDetail
