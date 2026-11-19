import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const { isAdmin } = useAuth()
  const [snippet, setSnippet] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [picked, setPicked] = useState('')   // 탭으로 고른 언어

  useEffect(() => {
    setSnippet(null)
    setError(null)
    setPicked('')
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

  // ?lang=Python 으로 들어오면 그 언어의 코드만 보여 준다(다른 언어는 안 보임). 없으면 언어 탭.
  const forced = searchParams.get('lang')
  const all = snippet.variants ?? []
  const variants = forced && all.some((v) => v.language === forced) ? all.filter((v) => v.language === forced) : all
  const current = variants.find((v) => v.language === picked) ?? variants[0]

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
        {variants.map((v) => (
          <span key={v.language} className="cb-badge"><i style={{ background: languageColor(v.language) }} />{v.language}</span>
        ))}
        {snippet.category && <span className="cb-card-cat">{snippet.category}</span>}
      </p>
      <h1>{snippet.title}</h1>
      {snippet.description && <p className="portfolio-summary">{snippet.description}</p>}
      <p className="portfolio-period">{formatDate(snippet.lastModifiedAt)}</p>
      <PostRelations post={snippet} />
      {variants.length > 1 && (
        <div className="cb-tabs" role="tablist" aria-label="언어 선택">
          {variants.map((v) => (
            <button
              key={v.language}
              type="button"
              role="tab"
              aria-selected={v.language === current?.language}
              className={`cb-tab${v.language === current?.language ? ' is-on' : ''}`}
              onClick={() => setPicked(v.language)}
            >
              <i style={{ background: languageColor(v.language) }} />{v.language}
            </button>
          ))}
        </div>
      )}
      {current && <MarkdownView>{current.content}</MarkdownView>}
    </article>
  )
}

export default CodebaseDetail
