import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { UNCATEGORIZED, LEVEL_PARAMS, categoryLink, filterPathFrom, pathOf, startsWith } from '../lib/archiveTree.js'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// Archive 목록 — ?category=대분류&sub=중분류&minor=소분류 로 걸러서 보여준다(없으면 전체 글).
// 글 목록은 ArchiveLayout이 받아온 전체 요약을 그대로 쓰고, 최신 글이 위에 오게 둔다.
function ArchiveList() {
  const { isAdmin } = useAuth()
  const { posts, indexError } = useOutletContext()
  const [searchParams] = useSearchParams()
  const filterPath = filterPathFrom(searchParams)
  const depth = filterPath.length

  const filtered = posts ? posts.filter((post) => startsWith(pathOf(post), filterPath)) : null

  // 분류를 보고 있는 중에 새 글을 쓰면 그 분류가 미리 채워지게 한다(미분류는 제외).
  const newParams = new URLSearchParams()
  if (filterPath[0] !== UNCATEGORIZED) filterPath.forEach((name, i) => newParams.set(LEVEL_PARAMS[i], name))
  const newLink = newParams.toString() ? `/archive/new?${newParams}` : '/archive/new'

  return (
    <section className="archive-page">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            {depth === 0 ? (
              'Archive'
            ) : (
              <>
                <Link to="/archive">Archive</Link>
                {filterPath.slice(0, -1).map((name, i) => (
                  <span key={name}>
                    {' › '}
                    <Link to={categoryLink(...filterPath.slice(0, i + 1))}>{name}</Link>
                  </span>
                ))}
              </>
            )}
          </p>
          <h2 className="section-title">{depth === 0 ? '전체 글' : filterPath[depth - 1]}</h2>
        </div>
        {isAdmin && (
          <Link to={newLink} className="btn-primary">+ 새 글 작성</Link>
        )}
      </div>

      {indexError && <p className="status status-error">목록을 불러오지 못했습니다. ({indexError})</p>}
      {!indexError && !filtered && <p className="status">불러오는 중...</p>}
      {!indexError && filtered && filtered.length === 0 && <p className="status">아직 작성된 글이 없습니다.</p>}

      {!indexError && filtered && filtered.length > 0 && (
        <ul className="post-list">
          {filtered.map((post) => {
            // 지금 보고 있는 분류 바로 아래 단계의 이름을 태그로 보여준다.
            const tag = pathOf(post)[depth]
            return (
              <li key={post.id} className="post-row">
                <Link to={`/archive/${post.id}`}>
                  <span className="post-title">
                    {tag && <span className="post-cat">{tag}</span>}
                    {post.title}
                  </span>
                  <span className="post-meta">{formatDate(post.lastModifiedAt)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ArchiveList
