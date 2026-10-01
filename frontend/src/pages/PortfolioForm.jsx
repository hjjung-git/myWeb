import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

const EMPTY = {
  type: 'PROJECT',
  title: '',
  summary: '',
  detailContent: '',
  periodText: '',
  techStack: '',
  linkUrl: '',
  thumbnailPath: '',
  displayOrder: 0,
}

// 생성/수정을 겸하는 폼 — URL에 :id가 있으면 수정 모드.
function PortfolioForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isAdmin, loading } = useAuth()

  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(!isEdit)

  useEffect(() => {
    if (!isEdit) return
    apiGet(`/api/portfolio-items/${id}`)
      .then((item) => {
        setForm({
          type: item.type,
          title: item.title,
          summary: item.summary,
          detailContent: item.detailContent ?? '',
          periodText: item.periodText ?? '',
          techStack: item.techStack ?? '',
          linkUrl: item.linkUrl ?? '',
          thumbnailPath: item.thumbnailPath ?? '',
          displayOrder: item.displayOrder ?? 0,
        })
        setReady(true)
      })
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  if (!loading && !isAdmin) {
    return <p className="status status-error">관리자 모드에서만 사용할 수 있습니다.</p>
  }

  if (!ready) {
    return <p className="status">불러오는 중...</p>
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) || 0 }
      const saved = isEdit
        ? await apiMutate(`/api/portfolio-items/${id}`, 'PUT', payload)
        : await apiMutate('/api/portfolio-items', 'POST', payload)
      navigate(`/portfolio/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit}>
      <h1>{isEdit ? '항목 수정' : '새 항목 추가'}</h1>

      <label>
        유형
        <select value={form.type} onChange={(e) => update('type', e.target.value)}>
          <option value="PROJECT">프로젝트</option>
          <option value="EXPERIENCE">경력</option>
        </select>
      </label>

      <label>
        제목
        <input value={form.title} onChange={(e) => update('title', e.target.value)} maxLength={100} required />
      </label>

      <label>
        요약 (목록에 보여질 짧은 설명)
        <textarea value={form.summary} onChange={(e) => update('summary', e.target.value)} maxLength={300} rows={3} required />
      </label>

      <label>
        상세 내용
        <textarea value={form.detailContent} onChange={(e) => update('detailContent', e.target.value)} rows={8} />
      </label>

      <label>
        기간
        <input value={form.periodText} onChange={(e) => update('periodText', e.target.value)} placeholder="예: 2025.03 - 2025.08" />
      </label>

      <label>
        기술 스택
        <input value={form.techStack} onChange={(e) => update('techStack', e.target.value)} placeholder="예: Java, Spring Boot, MySQL" />
      </label>

      <label>
        관련 링크
        <input value={form.linkUrl} onChange={(e) => update('linkUrl', e.target.value)} placeholder="https://..." />
      </label>

      <label>
        썸네일 경로
        <input value={form.thumbnailPath} onChange={(e) => update('thumbnailPath', e.target.value)} />
      </label>

      <label>
        정렬 순서
        <input type="number" value={form.displayOrder} onChange={(e) => update('displayOrder', e.target.value)} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {isEdit ? '저장' : '추가'}
        </button>
      </div>
    </form>
  )
}

export default PortfolioForm
