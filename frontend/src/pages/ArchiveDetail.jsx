import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkSpacing from '../lib/remarkSpacing.js'
import remarkSidenotes from '../lib/remarkSidenotes.js'
import Sidenote from '../components/Sidenote.jsx'
import SidenoteLayout from '../components/SidenoteLayout.jsx'
import { apiGet, apiMutate, resolveImageSrc } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import MermaidBlock from '../components/MermaidBlock.jsx'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function ArchiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  // ArchiveLayout이 사이드바 순서대로 펼쳐둔 글 목록 — 이전/다음 글 계산과 삭제 후 사이드바 갱신에 쓴다.
  const { ordered, reload } = useOutletContext()
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setPost(null)
    setError(null)
    apiGet(`/api/posts/${id}`)
      .then(setPost)
      .catch((err) => setError(err.message))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiMutate(`/api/posts/${id}`, 'DELETE')
      await reload()
      navigate('/archive')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (error) return <p className="status status-error">글을 불러오지 못했습니다. ({error})</p>
  if (!post) return <p className="status">불러오는 중...</p>

  const index = ordered.findIndex((p) => p.id === post.id)
  const prev = index > 0 ? ordered[index - 1] : null
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null
  // 분류 경로는 글이 어디에 있는지 알려주는 글자일 뿐, 누르면 이동하는 링크가 아니다(분류별 목록 화면은 없다).
  const crumbs = [post.category, post.category && post.subcategory, post.category && post.subcategory && post.minorCategory].filter(Boolean)

  return (
    <article className="portfolio-detail archive-article">
      <p className="archive-breadcrumb">
        <Link to="/archive" state={{ restoreScroll: true }}>Archive</Link>
        {crumbs.map((name, i) => (
          <span key={i}>{' › '}{name}</span>
        ))}
      </p>

      {isAdmin && (
        <div className="detail-toolbar">
          <Link to={`/archive/${id}/edit`} className="btn-secondary">수정</Link>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
            삭제
          </button>
        </div>
      )}

      <h1>{post.title}</h1>
      <p className="portfolio-period">{post.username} · {formatDate(post.lastModifiedAt)}</p>
      <SidenoteLayout enabled={/^\[\^[^\]]+\]:/m.test(post.content || '')}>
      <div className="portfolio-body markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkSidenotes, remarkSpacing]}
          components={{
            sidenote: Sidenote, // 각주 문법 → 우측 여백 메모(용어 설명)
            // 서버에 올린 이미지(/api/images/..)는 배포 환경에서도 열리도록 절대 주소로 바꿔서 보여준다.
            img: ({ src = '', alt = '' }) => <img src={resolveImageSrc(src)} alt={alt} loading="lazy" />,
            // ```mermaid 코드 블록은 코드 대신 그림으로 그린다. 나머지 코드 블록은 그대로.
            pre: ({ node, children, ...rest }) => {
              const codeEl = node?.children?.[0]
              const classes = codeEl?.properties?.className || []
              if (codeEl?.tagName === 'code' && classes.includes('language-mermaid')) {
                const text = (codeEl.children || []).map((child) => child.value || '').join('')
                return <MermaidBlock code={text.trim()} />
              }
              return <pre {...rest}>{children}</pre>
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
      </SidenoteLayout>

      {(prev || next) && (
        <nav className="archive-pager" aria-label="이전/다음 글">
          {prev ? (
            <Link to={`/archive/${prev.id}`} className="pager-link pager-prev">
              <span className="pager-label">← 이전 글</span>
              <span className="pager-title">{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/archive/${next.id}`} className="pager-link pager-next">
              <span className="pager-label">다음 글 →</span>
              <span className="pager-title">{next.title}</span>
            </Link>
          ) : <span />}
        </nav>
      )}
    </article>
  )
}

export default ArchiveDetail
