import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

const EMPTY = {
  name: '',
  institution: '',
  periodText: '',
  description: '',
  projectUrl: '',
  displayOrder: 0,
}

// 교육 메타데이터(교육명/기관/기간/배운 내용/프로젝트 링크/정렬순서) 생성·수정 폼.
// 수료증 PDF 업로드는 자격증과 마찬가지로 상세 페이지(EducationDetail)에서 바로 처리한다.
function EducationForm() {
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
    apiGet(`/api/educations/${id}`)
      .then((edu) => {
        setForm({
          name: edu.name,
          institution: edu.institution ?? '',
          periodText: edu.periodText ?? '',
          description: edu.description ?? '',
          projectUrl: edu.projectUrl ?? '',
          displayOrder: edu.displayOrder ?? 0,
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
      const payload = {
        ...form,
        displayOrder: Number(form.displayOrder) || 0,
      }
      const saved = isEdit
        ? await apiMutate(`/api/educations/${id}`, 'PUT', payload)
        : await apiMutate('/api/educations', 'POST', payload)
      navigate(`/educations/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit}>
      <h1>{isEdit ? '교육 수정' : '새 교육 추가'}</h1>

      <label>
        교육명
        <input value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={100} required />
      </label>

      <label>
        기관
        <input value={form.institution} onChange={(e) => update('institution', e.target.value)} maxLength={150} />
      </label>

      <label>
        기간 (예: 2025.03 ~ 2025.08)
        <input value={form.periodText} onChange={(e) => update('periodText', e.target.value)} maxLength={100} />
      </label>

      <label>
        배운 내용
        <textarea rows={8} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </label>

      <label>
        결과물 — 프로젝트 주소 (선택, 예: https://github.com/...)
        <input value={form.projectUrl} onChange={(e) => update('projectUrl', e.target.value)} maxLength={255} />
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

export default EducationForm
