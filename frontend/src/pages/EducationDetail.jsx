import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate, apiUpload, apiResourceUrl } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

// 교육 상세 페이지 — 배운 내용, 결과물(프로젝트 링크), 수료증(PDF)을 확인할 수 있다.
// 수료증 PDF는 /api/educations/{id}/certificate에서 직접 스트리밍해주므로 <object>로 그대로 띄운다.
// 업로드/삭제는 관리자 모드에서만 이 페이지에서 바로 처리한다(자격증 상세와 같은 방식).
function EducationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const fileInputRef = useRef(null)

  const [edu, setEdu] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  function load() {
    return apiGet(`/api/educations/${id}`)
      .then(setEdu)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    setEdu(null)
    setError(null)
    load()
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiMutate(`/api/educations/${id}`, 'DELETE')
      navigate('/#educations', { state: { restoreScroll: true } })
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
      const updated = await apiUpload(`/api/educations/${id}/certificate`, 'POST', formData)
      setEdu(updated)
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
      const updated = await apiMutate(`/api/educations/${id}/certificate`, 'DELETE')
      setEdu(updated)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (error) {
    return <p className="status status-error">교육을 불러오지 못했습니다. ({error})</p>
  }

  if (!edu) {
    return <p className="status">불러오는 중...</p>
  }

  const fileUrl = apiResourceUrl(`/api/educations/${id}/certificate`)

  return (
    <article className="portfolio-detail" style={{ padding: 'clamp(28px, 5vw, 44px) 0' }}>
      {/* 보던 위치로 돌아간다 (처음 들어온 화면이면 교육 섹션으로) */}
      <Link to="/#educations" state={{ restoreScroll: true }} className="back-link">← 목록으로</Link>

      {isAdmin && (
        <div className="detail-toolbar">
          <Link to={`/educations/${id}/edit`} className="btn-secondary">수정</Link>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
            삭제
          </button>
        </div>
      )}

      <h1>{edu.name}</h1>
      {edu.institution && <p className="portfolio-period">{edu.institution}</p>}
      {edu.periodText && <p className="portfolio-period">{edu.periodText}</p>}

      {edu.description && (
        <div className="portfolio-body" style={{ whiteSpace: 'pre-wrap' }}>{edu.description}</div>
      )}

      {edu.projectUrl && (
        <p>
          <a href={edu.projectUrl} target="_blank" rel="noreferrer" className="portfolio-link">
            결과물 보기 →
          </a>
        </p>
      )}

      <div className="cert-file-box">
        {edu.hasCertificateFile ? (
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
                  수료증 삭제
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="status">아직 등록된 수료증이 없습니다.</p>
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

export default EducationDetail
