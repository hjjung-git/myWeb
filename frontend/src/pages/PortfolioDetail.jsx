import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

function PortfolioDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setItem(null)
    setError(null)
    apiGet(`/api/portfolio-items/${id}`)
      .then(setItem)
      .catch((err) => setError(err.message))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiMutate(`/api/portfolio-items/${id}`, 'DELETE')
      navigate('/#portfolio')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (error) {
    return <p className="status status-error">항목을 불러오지 못했습니다. ({error})</p>
  }

  if (!item) {
    return <p className="status">불러오는 중...</p>
  }

  const techTags = item.techStack
    ? item.techStack.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  return (
    <article className="portfolio-detail" style={{ padding: 'clamp(28px, 5vw, 44px) 0' }}>
      <Link to="/#portfolio" className="back-link">← 목록으로</Link>

      {isAdmin && (
        <div className="detail-toolbar">
          <Link to={`/portfolio/${id}/edit`} className="btn-secondary">수정</Link>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
            삭제
          </button>
        </div>
      )}

      <span className="portfolio-type">{item.type === 'PROJECT' ? '프로젝트' : '경력'}</span>
      <h1>{item.title}</h1>
      {item.periodText && <p className="portfolio-period">{item.periodText}</p>}
      {techTags.length > 0 && (
        <div className="portfolio-tech">
          {techTags.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      )}
      <p className="portfolio-summary">{item.summary}</p>
      {item.detailContent && <div className="portfolio-body">{item.detailContent}</div>}
      {item.linkUrl && (
        <a href={item.linkUrl} target="_blank" rel="noreferrer" className="portfolio-link">
          관련 링크 →
        </a>
      )}
    </article>
  )
}

export default PortfolioDetail
