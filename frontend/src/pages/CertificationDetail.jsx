import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate, apiUpload, apiResourceUrl } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

function formatDate(isoDate) {
  if (!isoDate) return null
  const [y, m, d] = isoDate.split('-')
  return `${y}.${m}.${d}`
}

// 자격증 상세 페이지 — 합격일자와 합격확인증(PDF)을 확인할 수 있다.
// PDF는 /api/certifications/{id}/certificate에서 직접 스트리밍해주므로, <object>로 그대로 띄운다.
// 업로드/교체/삭제는 관리자 모드에서만 이 페이지에서 바로 처리한다(별도 폼 화면을 두지 않음) —
// 증명서 파일은 "보면서 바로 바꾸는" 용도라 수정 폼(이름/발급기관 등)과 분리하는 쪽이 자연스럽다.
function CertificationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const fileInputRef = useRef(null)

  const [cert, setCert] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  function load() {
    return apiGet(`/api/certifications/${id}`)
      .then(setCert)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    setCert(null)
    setError(null)
    load()
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiMutate(`/api/certifications/${id}`, 'DELETE')
      navigate('/#certifications')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const updated = await apiUpload(`/api/certifications/${id}/certificate`, 'POST', formData)
      setCert(updated)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleFileDelete() {
    setUploadError(null)
    setUploading(true)
    try {
      const updated = await apiMutate(`/api/certifications/${id}/certificate`, 'DELETE')
      setCert(updated)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (error) {
    return <p className="status status-error">자격증을 불러오지 못했습니다. ({error})</p>
  }

  if (!cert) {
    return <p className="status">불러오는 중...</p>
  }

  const fileUrl = apiResourceUrl(`/api/certifications/${id}/certificate`)

  return (
    <article className="portfolio-detail" style={{ padding: 'clamp(28px, 5vw, 44px) 0' }}>
      <Link to="/#certifications" className="back-link">← 목록으로</Link>

      {isAdmin && (
        <div className="detail-toolbar">
          <Link to={`/certifications/${id}/edit`} className="btn-secondary">수정</Link>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
            삭제
          </button>
        </div>
      )}

      <div className="cert-detail-mark">{cert.mark}</div>
      <h1>{cert.name}</h1>
      {cert.issuer && <p className="portfolio-period">{cert.issuer}</p>}
      {cert.acquiredDate && <p className="portfolio-period">합격일자 {formatDate(cert.acquiredDate)}</p>}

      <div className="cert-file-box">
        {cert.hasCertificateFile ? (
          <>
            <object data={fileUrl} type="application/pdf" className="cert-pdf-viewer">
              <p className="status">
                이 브라우저에서는 PDF를 바로 볼 수 없습니다. <a href={fileUrl} target="_blank" rel="noreferrer">여기서 열기</a>
              </p>
            </object>
            <div className="cert-file-actions">
              <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-secondary">새 탭에서 열기</a>
              {isAdmin && (
                <button type="button" className="btn-danger" onClick={handleFileDelete} disabled={uploading}>
                  증명서 삭제
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="status">아직 등록된 합격확인증이 없습니다.</p>
        )}

        {isAdmin && (
          <div className="cert-upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && <span className="status">업로드 중...</span>}
          </div>
        )}
        {uploadError && <p className="form-error">{uploadError}</p>}
      </div>
    </article>
  )
}

export default CertificationDetail
