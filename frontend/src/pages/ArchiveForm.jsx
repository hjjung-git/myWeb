import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiGet, apiMutate, apiUpload } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import MarkdownLiveEditor from '../components/MarkdownLiveEditor.jsx'

// 아카이브 글 작성/수정 폼. 매매일지(TRADE_LOG) 관련 필드는 백엔드 레거시 정리 때
// 도메인째로 삭제되어 더 이상 존재하지 않는다.
// 내용(content)은 DB/API 입장에서는 그냥 평범한 markdown 텍스트(TEXT 컬럼)이고, 쓰는 화면에서만
// MarkdownLiveEditor(CodeMirror 6 기반)가 Obsidian의 Live Preview처럼 커서가 벗어난 줄의
// markdown 기호를 숨기고 서식만 보여준다 — 저장되는 값 자체는 항상 순수 markdown 원문이다.
function ArchiveForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isAdmin, loading } = useAuth()

  const [searchParams] = useSearchParams()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  // 새 글은 분류 화면에서 "+ 새 글 작성"으로 들어오면 그 분류가 미리 채워진다(?category=&sub=).
  const [category, setCategory] = useState(() => (isEdit ? '' : searchParams.get('category') || ''))
  const [subcategory, setSubcategory] = useState(() => (isEdit ? '' : searchParams.get('sub') || ''))
  const [minorCategory, setMinorCategory] = useState(() => (isEdit ? '' : searchParams.get('minor') || ''))
  const [allPosts, setAllPosts] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(!isEdit)

  useEffect(() => {
    if (!isEdit) return
    apiGet(`/api/posts/${id}`)
      .then((post) => {
        setTitle(post.title)
        setContent(post.content)
        setCategory(post.category ?? '')
        setSubcategory(post.subcategory ?? '')
        setMinorCategory(post.minorCategory ?? '')
        setReady(true)
      })
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  // 이미 쓰고 있는 분류 이름을 입력 칸 추천 목록으로 보여주기 위해 전체 글 요약을 받아온다.
  useEffect(() => {
    apiGet('/api/posts/index')
      .then(setAllPosts)
      .catch(() => setAllPosts([]))
  }, [])

  const categoryOptions = [...new Set(allPosts.map((p) => p.category).filter(Boolean))].sort()
  const subcategoryOptions = [
    ...new Set(allPosts.filter((p) => p.category === category.trim()).map((p) => p.subcategory).filter(Boolean)),
  ].sort()
  const minorCategoryOptions = [
    ...new Set(
      allPosts
        .filter((p) => p.category === category.trim() && p.subcategory === subcategory.trim())
        .map((p) => p.minorCategory)
        .filter(Boolean)
    ),
  ].sort()

  if (!loading && !isAdmin) {
    return <p className="status status-error">관리자 모드에서만 사용할 수 있습니다.</p>
  }
  if (!ready) return <p className="status">불러오는 중...</p>

  // 에디터에 붙여넣기/끌어놓기/첨부한 이미지를 서버(DB)에 올리고 주소를 돌려준다.
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
      const payload = { title, content, category, subcategory, minorCategory }
      const saved = isEdit
        ? await apiMutate(`/api/posts/${id}`, 'PUT', payload)
        : await apiMutate('/api/posts', 'POST', payload)
      navigate(`/archive/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit} style={{ maxWidth: '760px' }}>
      <h1>{isEdit ? '글 수정' : '새 글 작성'}</h1>

      <label>
        제목
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
      </label>

      <div className="form-row form-row-3">
        <label>
          대분류 (비우면 미분류)
          <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={50} list="archive-category-options" />
          <datalist id="archive-category-options">
            {categoryOptions.map((name) => <option key={name} value={name} />)}
          </datalist>
        </label>

        <label>
          중분류 (선택)
          <input
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            maxLength={50}
            list="archive-subcategory-options"
            disabled={!category.trim()}
          />
          <datalist id="archive-subcategory-options">
            {subcategoryOptions.map((name) => <option key={name} value={name} />)}
          </datalist>
        </label>

        <label>
          소분류 (선택)
          <input
            value={minorCategory}
            onChange={(e) => setMinorCategory(e.target.value)}
            maxLength={50}
            list="archive-minor-category-options"
            disabled={!category.trim() || !subcategory.trim()}
          />
          <datalist id="archive-minor-category-options">
            {minorCategoryOptions.map((name) => <option key={name} value={name} />)}
          </datalist>
        </label>
      </div>

      {/* <label>이 아니라 div인 이유: 라벨 안에 "이미지 첨부" 버튼이 있으면 라벨 아무 곳이나 클릭해도
          그 버튼이 눌린 것으로 처리돼서 파일 선택창이 뜨기 때문 */}
      <div className="form-field">
        내용 (Markdown — 커서가 있는 줄만 원문이 보이고, 벗어나면 바로 서식이 적용됩니다)
        {/* key={id || 'new'}로 새 글/다른 글 수정으로 이동할 때마다 내부 상태를 완전히 새로 초기화한다 */}
        <MarkdownLiveEditor
          key={id || 'new'}
          initialValue={content}
          onChange={setContent}
          placeholder={'# 제목처럼, **굵게**, - 목록 처럼 markdown 문법을 쓰면 커서가 벗어난 줄부터 바로 서식이 적용돼'}
          onUploadImage={uploadImage}
          onUploadError={(message) => setError(`이미지 업로드 실패: ${message}`)}
        />
        <p className="mle-shortcuts-hint">
          ⌘/Ctrl+B 굵게 · ⌘/Ctrl+I 기울임 · ⌘/Ctrl+E 코드 · ⌘/Ctrl+Shift+X 취소선 · ⌘/Ctrl+K 링크 · ⌘/Ctrl+1~3 제목
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {isEdit ? '저장' : '게시'}
        </button>
      </div>
    </form>
  )
}

export default ArchiveForm
