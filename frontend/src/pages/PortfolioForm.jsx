import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

// 새 프로젝트를 쓸 때 상세 내용에 미리 깔아 주는 섹션 틀 — 마크다운이라서 지우거나 바꿔도 된다.
const PROJECT_TEMPLATE = `## 개요
(어떤 프로젝트인지 한두 문장)

## 문제 / 배경
(왜 필요했는지, 어떤 제약이 있었는지)

## 내가 한 일
- 

## 구조
(아키텍처 설명 — 표나 \`\`\`mermaid 다이어그램, 이미지도 쓸 수 있습니다)

## 결과
- 

## 배운 점
- 
`

const EMPTY = {
  type: 'PROJECT',
  title: '',
  summary: '',
  detailContent: '',
  periodText: '',
  techStack: '',
  linkUrl: '',
  thumbnailPath: '',
  employmentType: '',
  department: '',
  jobRank: '',
  resignationReason: '',
  displayOrder: 0,
}

// 생성/수정을 겸하는 폼 — URL에 :id가 있으면 수정 모드.
function PortfolioForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isAdmin, loading } = useAuth()

  const [searchParams] = useSearchParams()
  // /portfolio/new?type=EXPERIENCE 로 들어오면 처음부터 "경력" 입력 화면으로 연다.
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    type: searchParams.get('type') === 'EXPERIENCE' ? 'EXPERIENCE' : 'PROJECT',
    detailContent: !id && searchParams.get('type') !== 'EXPERIENCE' ? PROJECT_TEMPLATE : '',
  }))
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
          employmentType: item.employmentType ?? '',
          department: item.department ?? '',
          jobRank: item.jobRank ?? '',
          resignationReason: item.resignationReason ?? '',
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

  // 경력은 요약/기술스택/링크/썸네일을 쓰지 않고, 프로젝트는 경력 전용 필드를 쓰지 않는다.
  const isExp = form.type === 'EXPERIENCE'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) || 0 }
      if (isExp) {
        Object.assign(payload, { summary: '', techStack: '', linkUrl: '', thumbnailPath: '' })
      } else {
        Object.assign(payload, { employmentType: '', department: '', jobRank: '', resignationReason: '' })
      }
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
        <select
          value={form.type}
          onChange={(e) => {
            const type = e.target.value
            setForm((prev) => {
              let detailContent = prev.detailContent
              // 새 항목에서 유형을 바꾸면 깔아 둔 섹션 틀도 같이 맞춘다 (경력에는 틀이 없다).
              if (!isEdit && type === 'EXPERIENCE' && detailContent === PROJECT_TEMPLATE) detailContent = ''
              if (!isEdit && type === 'PROJECT' && !detailContent) detailContent = PROJECT_TEMPLATE
              return { ...prev, type, detailContent }
            })
          }}
        >
          <option value="PROJECT">프로젝트</option>
          <option value="EXPERIENCE">경력</option>
        </select>
      </label>

      <label>
        {isExp ? '회사명' : '제목'}
        <input value={form.title} onChange={(e) => update('title', e.target.value)} maxLength={100} required />
      </label>

      {!isExp && (
        <label>
          요약 (목록에 보여질 짧은 설명)
          <textarea value={form.summary} onChange={(e) => update('summary', e.target.value)} maxLength={300} rows={3} required />
        </label>
      )}

      <label>
        {isExp ? '담당 업무' : '상세 내용 (마크다운)'}
        <textarea
          className={isExp ? undefined : 'md-textarea'}
          value={form.detailContent}
          onChange={(e) => update('detailContent', e.target.value)}
          rows={isExp ? 8 : 20}
        />
      </label>
      {!isExp && (
        <div className="form-hint">
          <span>제목(##)·목록·표·이미지·mermaid 다이어그램을 쓸 수 있습니다.</span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (!form.detailContent.trim() || window.confirm('지금 내용 뒤에 섹션 틀을 덧붙일까요?')) {
                update('detailContent', form.detailContent ? `${form.detailContent.trimEnd()}\n\n${PROJECT_TEMPLATE}` : PROJECT_TEMPLATE)
              }
            }}
          >
            섹션 틀 넣기
          </button>
        </div>
      )}

      <label>
        {isExp ? '근무 기간' : '기간'}
        <input value={form.periodText} onChange={(e) => update('periodText', e.target.value)} placeholder="예: 2025.03 - 2025.08" />
      </label>

      {isExp && (
        <>
          <label>
            고용형태
            <input
              value={form.employmentType}
              onChange={(e) => update('employmentType', e.target.value)}
              list="employment-type-options"
              maxLength={50}
              placeholder="예: 정규직"
            />
            <datalist id="employment-type-options">
              <option value="정규직" />
              <option value="계약직" />
              <option value="인턴" />
              <option value="파견직" />
              <option value="아르바이트" />
            </datalist>
          </label>

          <label>
            부서
            <input value={form.department} onChange={(e) => update('department', e.target.value)} maxLength={100} />
          </label>

          <label>
            직급
            <input value={form.jobRank} onChange={(e) => update('jobRank', e.target.value)} maxLength={50} />
          </label>

          <label>
            퇴직 사유
            <input value={form.resignationReason} onChange={(e) => update('resignationReason', e.target.value)} maxLength={500} />
          </label>
        </>
      )}

      {!isExp && (
        <>
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
        </>
      )}

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
