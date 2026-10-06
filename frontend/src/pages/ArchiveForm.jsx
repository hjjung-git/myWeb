import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiMutate } from '../lib/api.js'
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

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(!isEdit)

  useEffect(() => {
    if (!isEdit) return
    apiGet(`/api/posts/${id}`)
      .then((post) => {
        setTitle(post.title)
        setContent(post.content)
        setReady(true)
      })
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  if (!loading && !isAdmin) {
    return <p className="status status-error">관리자 모드에서만 사용할 수 있습니다.</p>
  }
  if (!ready) return <p className="status">불러오는 중...</p>

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = { title, content }
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

      <label>
        내용 (Markdown — 커서가 있는 줄만 원문이 보이고, 벗어나면 바로 서식이 적용됩니다)
        {/* key={id || 'new'}로 새 글/다른 글 수정으로 이동할 때마다 내부 상태를 완전히 새로 초기화한다 */}
        <MarkdownLiveEditor
          key={id || 'new'}
          initialValue={content}
          onChange={setContent}
          placeholder={'# 제목처럼, **굵게**, - 목록 처럼 markdown 문법을 쓰면 커서가 벗어난 줄부터 바로 서식이 적용돼'}
        />
        <p className="mle-shortcuts-hint">
          ⌘/Ctrl+B 굵게 · ⌘/Ctrl+I 기울임 · ⌘/Ctrl+E 코드 · ⌘/Ctrl+Shift+X 취소선 · ⌘/Ctrl+K 링크 · ⌘/Ctrl+1~3 제목
        </p>
      </label>

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
