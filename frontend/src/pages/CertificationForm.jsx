import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

const EMPTY = {
  mark: '',
  name: '',
  issuer: '',
  acquiredDate: '',
  displayOrder: 0,
}

// 자격증 메타데이터(마크/이름/발급기관/합격일자/정렬순서) 생성·수정 폼.
// 합격확인증 PDF 업로드는 여기서 하지 않고 상세 페이지(CertificationDetail)에서 바로 처리한다 —
// "보면서 바로 바꾸는" 파일이라 수정 폼과 분리하는 쪽이 자연스럽다.
function CertificationForm() {
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
    apiGet(`/api/certifications/${id}`)
      .then((cert) => {
        setForm({
          mark: cert.mark,
          name: cert.name,
          issuer: cert.issuer ?? '',
          acquiredDate: cert.acquiredDate ?? '',
          displayOrder: cert.displayOrder ?? 0,
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
        acquiredDate: form.acquiredDate || null,
        displayOrder: Number(form.displayOrder) || 0,
      }
      const saved = isEdit
        ? await apiMutate(`/api/certifications/${id}`, 'PUT', payload)
        : await apiMutate('/api/certifications', 'POST', payload)
      navigate(`/certifications/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit}>
      <h1>{isEdit ? '자격증 수정' : '새 자격증 추가'}</h1>

      <label>
        마크 (카드에 보일 짧은 표시, 예: SQL)
        <input value={form.mark} onChange={(e) => update('mark', e.target.value)} maxLength={10} required />
      </label>

      <label>
        자격증명
        <input value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={100} required />
      </label>

      <label>
        발급기관
        <input value={form.issuer} onChange={(e) => update('issuer', e.target.value)} maxLength={150} />
      </label>

      <label>
        합격일자
        <input type="date" value={form.acquiredDate} onChange={(e) => update('acquiredDate', e.target.value)} />
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

export default CertificationForm
