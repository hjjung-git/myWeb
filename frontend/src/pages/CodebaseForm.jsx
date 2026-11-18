import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate, apiUpload } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import MarkdownLiveEditor from '../components/MarkdownLiveEditor.jsx'
import RelationPicker from '../components/RelationPicker.jsx'
import { SKILL_GROUPS } from '../lib/skillsData.js'
import { COMMON_LANGUAGES, CODE_CATEGORIES } from '../lib/codebase.js'
import { fetchPortfolioChoices, splitTech } from '../lib/portfolioApi.js'

// Codebase 글 작성/수정 폼 — Archive 글 작성과 같은 마크다운 편집기. 코드는 ```언어 ``` 블록으로 넣는다.
function CodebaseForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isAdmin, loading } = useAuth()

  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [relatedSkills, setRelatedSkills] = useState([])
  const [relatedProjectIds, setRelatedProjectIds] = useState([])
  const [choices, setChoices] = useState([])
  const [existing, setExisting] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(!isEdit)

  useEffect(() => {
    if (!isEdit) return
    apiGet(`/api/snippets/${id}`)
      .then((s) => {
        setTitle(s.title)
        setLanguage(s.language)
        setCategory(s.category ?? '')
        setDescription(s.description ?? '')
        setContent(s.content)
        setRelatedSkills(splitTech(s.relatedSkills))
        setRelatedProjectIds(splitTech(s.relatedProjectIds))
        setReady(true)
      })
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  useEffect(() => {
    fetchPortfolioChoices().then(setChoices).catch(() => setChoices([]))
    apiGet('/api/snippets').then(setExisting).catch(() => setExisting([]))
  }, [])

  const languageOptions = [...new Set([...COMMON_LANGUAGES, ...existing.map((s) => s.language)])]
  const categoryOptions = [...new Set([...CODE_CATEGORIES, ...existing.map((s) => s.category).filter(Boolean)])]
  const skillOptions = [...new Set(SKILL_GROUPS.flatMap((g) => g.tags))].map((t) => ({ value: t, label: t }))

  if (!loading && !isAdmin) return <p className="status status-error">관리자 모드에서만 사용할 수 있습니다.</p>
  if (!ready) return <p className="status">불러오는 중...</p>

  async function uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return apiUpload('/api/images', 'POST', formData)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        title,
        language,
        category,
        description,
        content,
        relatedSkills: relatedSkills.join(','),
        relatedProjectIds: relatedProjectIds.join(','),
      }
      const saved = isEdit
        ? await apiMutate(`/api/snippets/${id}`, 'PUT', payload)
        : await apiMutate('/api/snippets', 'POST', payload)
      navigate(`/codebase/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit} style={{ maxWidth: '820px' }}>
      <h1>{isEdit ? '코드 수정' : '새 코드'}</h1>

      <div className="form-row">
        <label>
          제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
        </label>
        <label>
          언어
          <input value={language} onChange={(e) => setLanguage(e.target.value)} maxLength={30} list="codebase-language-options" required />
          <datalist id="codebase-language-options">
            {languageOptions.map((name) => <option key={name} value={name} />)}
          </datalist>
        </label>
      </div>

      <label>
        용도 (선택 — 언어 안에서 묶는 소제목)
        <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={30} list="codebase-category-options" placeholder="예: 재사용 알고리즘" />
        <datalist id="codebase-category-options">
          {categoryOptions.map((name) => <option key={name} value={name} />)}
        </datalist>
      </label>

      <label>
        한 줄 설명 (선택 — 목록에 보여요)
        <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
      </label>

      <RelationPicker label="관련 기술 (선택)" options={skillOptions} selected={relatedSkills} onChange={setRelatedSkills} />
      <RelationPicker
        label="관련 프로젝트·경력 (선택)"
        options={choices.map((c) => ({ value: c.id, label: c.title }))}
        selected={relatedProjectIds}
        onChange={setRelatedProjectIds}
        empty="등록된 프로젝트·경력이 없습니다."
      />

      <div className="form-field">
        내용 (Markdown — 코드는 ```언어 블록으로 넣으세요)
        <MarkdownLiveEditor
          key={id || 'new'}
          initialValue={content}
          onChange={setContent}
          placeholder={'설명을 쓰고, 코드는 ```java … ``` 처럼 블록으로 넣으면 돼요'}
          onUploadImage={uploadImage}
          onUploadError={(message) => setError(`이미지 업로드 실패: ${message}`)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{isEdit ? '저장' : '게시'}</button>
      </div>
    </form>
  )
}

export default CodebaseForm
