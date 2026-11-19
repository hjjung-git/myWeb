import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate, apiUpload, apiResourceUrl } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import BackButton from '../components/BackButton.jsx'

// 교육 상세 페이지 — 포스터 이미지, 배운 내용, 결과물(프로젝트 링크), 수료증(PDF 또는 이미지)을 확인할 수 있다.
// 포스터는 /api/educations/{id}/poster, 수료증은 /api/educations/{id}/certificate 에서 직접 내려받는다.
// 수료증이 PDF면 <object>로, 이미지면 <img>로 띄운다. 업로드/삭제는 관리자 모드에서만 이 페이지에서 처리한다.
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
const CERT_ACCEPT = `application/pdf,${IMAGE_ACCEPT}`

function EducationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [edu, setEdu] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  // 같은 주소로 파일을 교체해도 브라우저 캐시 때문에 옛 파일이 보이지 않도록 업로드마다 바꾼다
  const [version, setVersion] = useState(0)

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

  // kind: 'certificate' | 'poster'
  async function handleFileChange(kind, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const updated = await apiUpload(`/api/educations/${id}/${kind}`, 'POST', formData)
      setEdu(updated)
      setVersion((v) => v + 1)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleFileDelete(kind) {
    setUploadError(null)
    setUploading(true)
    try {
      const updated = await apiMutate(`/api/educations/${id}/${kind}`, 'DELETE')
      setEdu(updated)
      setVersion((v) => v + 1)
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

  const certUrl = `${apiResourceUrl(`/api/educations/${id}/certificate`)}?v=${version}`
  const posterUrl = `${apiResourceUrl(`/api/educations/${id}/poster`)}?v=${version}`
  const certIsPdf = (edu.certificateContentType ?? 'application/pdf') === 'application/pdf'

  return (
    <article className="portfolio-detail" style={{ padding: 'clamp(28px, 5vw, 44px) 0' }}>
      {/* 보던 위치로 돌아간다 (처음 들어온 화면이면 교육 섹션으로) */}
      <BackButton to="/#educations" label="목록으로 돌아가기" />

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

      {(edu.hasPoster || isAdmin) && (
        <div className="edu-poster-box">
          {edu.hasPoster ? (
            <a href={posterUrl} target="_blank" rel="noreferrer" title="원본 크기로 보기">
              <img src={posterUrl} alt={`${edu.name} 포스터`} className="edu-poster" />
            </a>
          ) : (
            <p className="status">아직 등록된 포스터가 없습니다.</p>
          )}
          {isAdmin && (
            <div className="cert-upload-row">
              <label className="upload-label">
                포스터 {edu.hasPoster ? '교체' : '업로드'} (JPG·PNG·WebP)
                <input type="file" accept={IMAGE_ACCEPT} onChange={(e) => handleFileChange('poster', e)} disabled={uploading} />
              </label>
              {edu.hasPoster && (
                <button type="button" className="btn-danger" onClick={() => handleFileDelete('poster')} disabled={uploading}>
                  포스터 삭제
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
        <h2 className="cert-file-title">수료증</h2>
        {edu.hasCertificateFile ? (
          <>
            {certIsPdf ? (
              <object data={certUrl} type="application/pdf" className="cert-pdf-viewer">
                <p className="status">
                  이 브라우저에서는 PDF를 바로 볼 수 없습니다. <a href={certUrl} target="_blank" rel="noreferrer">여기서 열기</a>
                </p>
              </object>
            ) : (
              <a href={certUrl} target="_blank" rel="noreferrer" title="원본 크기로 보기">
                <img src={certUrl} alt={`${edu.name} 수료증`} className="cert-image" />
              </a>
            )}
            <div className="cert-file-actions">
              <a href={certUrl} target="_blank" rel="noreferrer" className="btn-secondary">새 탭에서 열기</a>
              {isAdmin && (
                <button type="button" className="btn-danger" onClick={() => handleFileDelete('certificate')} disabled={uploading}>
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
            <label className="upload-label">
              수료증 {edu.hasCertificateFile ? '교체' : '업로드'} (PDF·JPG·PNG·WebP)
              <input type="file" accept={CERT_ACCEPT} onChange={(e) => handleFileChange('certificate', e)} disabled={uploading} />
            </label>
            {uploading && <span className="status">업로드 중...</span>}
          </div>
        )}
        {uploadError && <p className="form-error">{uploadError}</p>}
      </div>
    </article>
  )
}

export default EducationDetail
