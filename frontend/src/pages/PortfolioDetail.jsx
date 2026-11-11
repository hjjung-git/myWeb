import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { splitTech } from '../lib/portfolioApi.js'
import MarkdownView from '../components/MarkdownView.jsx'

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
      navigate('/portfolio')
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

  const isExp = item.type === 'EXPERIENCE'

  const techTags = splitTech(item.techStack)

  return (
    <article className="portfolio-detail" style={{ padding: 'clamp(28px, 5vw, 44px) 0' }}>
      {/* 경력/프로젝트 전체 페이지로 돌아간다 (보던 위치 그대로) */}
      <Link to="/portfolio" state={{ restoreScroll: true }} className="back-link">← 경력 / 프로젝트</Link>

      {isAdmin && (
        <div className="detail-toolbar">
          <Link to={`/portfolio/${id}/edit`} className="btn-secondary">수정</Link>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
            삭제
          </button>
        </div>
      )}

      {isExp ? (
        <>
          <span className="portfolio-type">경력 사항</span>
          <h1>{item.title}</h1>
          <dl className="career-info">
            {[
              ['회사명', item.title],
              ['고용형태', item.employmentType],
              ['근무 기간', item.periodText],
              ['부서', item.department],
              ['직급', item.jobRank],
              ['담당 업무', item.detailContent],
              ['퇴직 사유', item.resignationReason],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="career-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </>
      ) : (
        <>
          <span className="portfolio-type">프로젝트</span>
          <h1>{item.title}</h1>
          {item.summary && <p className="portfolio-summary">{item.summary}</p>}
          {(item.periodText || techTags.length > 0 || item.linkUrl) && (
            <dl className="project-meta">
              {item.periodText && (
                <div className="project-meta-row">
                  <dt>기간</dt>
                  <dd>{item.periodText}</dd>
                </div>
              )}
              {techTags.length > 0 && (
                <div className="project-meta-row">
                  <dt>기술 스택</dt>
                  <dd>
                    <span className="portfolio-tech">
                      {techTags.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </span>
                  </dd>
                </div>
              )}
              {item.linkUrl && (
                <div className="project-meta-row">
                  <dt>링크</dt>
                  <dd>
                    <a href={item.linkUrl} target="_blank" rel="noreferrer" className="portfolio-link-inline">
                      {item.linkUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          )}
          {item.detailContent ? (
            <MarkdownView>{item.detailContent}</MarkdownView>
          ) : (
            isAdmin && <p className="status">상세 내용이 비어 있습니다. 수정에서 마크다운으로 채워 보세요.</p>
          )}
        </>
      )}
    </article>
  )
}

export default PortfolioDetail
