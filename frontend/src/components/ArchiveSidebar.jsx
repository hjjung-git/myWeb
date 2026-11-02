import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { categoryLink, countPosts, filterPathFrom } from '../lib/archiveTree.js'

function samePath(a, b) {
  return a.length === b.length && a.every((name, i) => name === b[i])
}

function PostLinks({ posts }) {
  if (posts.length === 0) return null
  return (
    <ul className="tree-posts">
      {posts.map((post) => (
        <li key={post.id}>
          <NavLink to={`/archive/${post.id}`}>{post.title}</NavLink>
        </li>
      ))}
    </ul>
  )
}

// 대분류/중분류는 접고 펼 수 있고, 소분류는 이름 아래에 글 목록만 보인다.
function TreeNode({ node, depth, activePath }) {
  const isActive = samePath(node.path, activePath)
  const nameLink = (
    <Link to={categoryLink(...node.path)} className={isActive ? 'active' : undefined}>
      {node.name}
    </Link>
  )

  if (depth >= 2) {
    return (
      <div className="tree-node tree-depth-2">
        <div className="tree-label">{nameLink}</div>
        <PostLinks posts={node.posts} />
      </div>
    )
  }

  return (
    <details className={`tree-node tree-depth-${depth}`} open>
      <summary>
        {nameLink}
        {depth === 0 && <span className="tree-count">{countPosts(node)}</span>}
      </summary>
      <PostLinks posts={node.posts} />
      {node.children.map((child) => (
        <TreeNode key={child.name} node={child} depth={depth + 1} activePath={activePath} />
      ))}
    </details>
  )
}

// Archive 왼쪽 사이드바 — 대분류 > 중분류 > 소분류 > 글 제목 트리.
// 모바일에서는 기본으로 접혀 있고 "카테고리" 버튼으로 연다.
function ArchiveSidebar({ tree, loading, error }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  // 다른 글/분류로 이동하면 모바일 메뉴는 닫는다.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  const onListPage = location.pathname === '/archive'
  const activePath = onListPage ? filterPathFrom(searchParams) : []

  return (
    <aside className={`archive-sidebar${mobileOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="archive-sidebar-toggle btn-secondary"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
      >
        카테고리 {mobileOpen ? '닫기 ▲' : '열기 ▼'}
      </button>

      <nav className="archive-tree" aria-label="Archive 카테고리">
        <Link to="/archive" className={`tree-all${onListPage && activePath.length === 0 ? ' active' : ''}`}>
          전체 글
        </Link>

        {error && <p className="status status-error">분류를 불러오지 못했습니다.</p>}
        {!error && loading && <p className="status">불러오는 중...</p>}

        {tree.map((node) => (
          <TreeNode key={node.name} node={node} depth={0} activePath={activePath} />
        ))}
      </nav>
    </aside>
  )
}

export default ArchiveSidebar
