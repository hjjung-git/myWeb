import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate, apiUpload } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import MarkdownLiveEditor from '../components/MarkdownLiveEditor.jsx'
import RelationPicker from '../components/RelationPicker.jsx'
import { SKILL_GROUPS } from '../lib/skillsData.js'
import { COMMON_LANGUAGES, CODE_CATEGORIES } from '../lib/codebase.js'
import { fetchPortfolioChoices, splitTech } from '../lib/portfolioApi.js'

// Codebase 글 작성/수정 폼 — Archive 글 작성과 같은 마크다운 편집기. 한 글에 여러 언어의 코드를 넣을 수 있고(언어마다 편집기 하나),
// 코드는 ```언어 ``` 블록으로 넣는다.
let nextKey = 1
function CodebaseForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isAdmin, loading } = useAuth()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [variants, setVariants] = useState(() => [{ key: nextKey++, language: '', content: '' }])
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
        setCategory(s.category ?? '')
        setDescription(s.description ?? '')
        setVariants((s.variants?.length ? s.variants : [{ language: '', content: '' }]).map((v) => ({ key: nextKey++, language: v.language, content: v.content })))
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

  const languageOptions = [...new Set([...COMMON_LANGUAGES, ...existing.flatMap((s) => s.languages ?? [])])]
  const categoryOptions = [...new Set([...CODE_CATEGORIES, ...existing.map((s) => s.category).filter(Boolean)])]
  const skillOptions = [...new Set(SKILL_GROUPS.flatMap((g) => g.tags))].map((t) => ({ value: t, label: t }))

  if (!loading && !isAdmin) return <p className="status status-error">관리자 모드에서만 사용할 수 있습니다.</p>
  if (!ready) return <p className="status">불러오는 중...</p>

  const updateVariant = (key, patch) => setVariants((list) => list.map((v) => (v.key === key ? { ...v, ...patch } : v)))
  const addVariant = () => setVariants((list) => [...list, { key: nextKey++, language: '', content: '' }])
  const removeVariant = (key) => setVariants((list) => (list.length > 1 ? list.filter((v) => v.key !== key) : list))

  async function uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return apiUpload('/api/images', 'POST', formData)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const names = variants.map((v) => v.language.trim().toLowerCase())
    if (variants.some((v) => !v.language.trim() || !v.content.trim())) {
      setError('모든 언어 칸에 언어 이름과 내용을 채워 주세요.')
      return
    }
    if (new Set(names).size !== names.length) {
      setError('같은 언어가 두 번 들어 있습니다.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        category,
        description,
        variants: variants.map((v) => ({ language: v.language.trim(), content: v.content })),
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

      <label>
        제목
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
      </label>

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

      <datalist id="codebase-language-options">
        {languageOptions.map((name) => <option key={name} value={name} />)}
      </datalist>
      <div className="form-field">
        언어별 코드 (Markdown — 같은 내용을 다른 언어로도 쓰려면 아래에서 언어를 추가하세요)
        {variants.map((v, i) => (
          <fieldset key={v.key} className="cb-variant">
            <div className="cb-variant-head">
              <input
                value={v.language}
                onChange={(e) => updateVariant(v.key, { language: e.target.value })}
                maxLength={30}
                list="codebase-language-options"
                placeholder={`언어 ${i + 1} (예: Python)`}
                aria-label={`언어 ${i + 1}`}
              />
              {variants.length > 1 && (
                <button type="button" className="btn-secondary" onClick={() => removeVariant(v.key)}>이 언어 삭제</button>
              )}
            </div>
            <MarkdownLiveEditor
              key={`${id || 'new'}-${v.key}`}
              initialValue={v.content}
              onChange={(val) => updateVariant(v.key, { content: val })}
              placeholder={'설명을 쓰고, 코드는 ```언어 … ``` 처럼 블록으로 넣으면 돼요'}
              onUploadImage={uploadImage}
              onUploadError={(message) => setError(`이미지 업로드 실패: ${message}`)}
            />
          </fieldset>
        ))}
        <button type="button" className="btn-secondary cb-add-variant" onClick={addVariant}>+ 언어 추가</button>
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{isEdit ? '저장' : '게시'}</button>
      </div>
    </form>
  )
}

export default CodebaseForm
