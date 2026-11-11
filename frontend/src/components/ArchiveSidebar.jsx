import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, matchPath, useLocation } from 'react-router-dom'

// 펼쳐 둔 분류를 브라우저에 기억한다 (이 기기에서만 쓰는 편의 기능이라 실패해도 그냥 넘어간다).
const STORAGE_KEY = 'archive-tree-open'

const keyOf = (path) => JSON.stringify(path)

function loadOpenKeys() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return new Set(Array.isArray(saved) ? saved : [])
  } catch {
    return new Set()
  }
}

function saveOpenKeys(keys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]))
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 기억만 포기한다.
  }
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

// 대분류·중분류·소분류가 각각 따로 접고 펼쳐진다.
// 분류 이름을 누르면 화면은 그대로 두고 아래 항목만 열고 닫는다 — 글을 눌러야 글이 열린다.
function TreeNode({ node, depth, openKeys, onToggle }) {
  const key = keyOf(node.path)
  const isOpen = openKeys.has(key)

  return (
    <div className={`tree-node tree-depth-${depth}`}>
      <button type="button" className="tree-row" onClick={() => onToggle(key)} aria-expanded={isOpen}>
        <span className="tree-name">{node.name}</span>
        <span className="tree-arrow" aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      {isOpen && (
        <>
          <PostLinks posts={node.posts} />
          {node.children.map((child) => (
            <TreeNode key={child.name} node={child} depth={depth + 1} openKeys={openKeys} onToggle={onToggle} />
          ))}
        </>
      )}
    </div>
  )
}

// Archive 왼쪽 사이드바 — 대분류 > 중분류 > 소분류 > 글 제목 트리.
// 모바일에서는 기본으로 접혀 있고 "카테고리" 버튼으로 연다.
function ArchiveSidebar({ tree, loading, error }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState(loadOpenKeys)

  // 다른 글로 이동하면 모바일 메뉴는 닫는다.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const onHome = location.pathname === '/archive'

  // 글 상세 화면이면 그 글이 속한 분류 경로를 찾아 둔다.
  const postPaths = useMemo(() => {
    const map = new Map()
    const walk = (nodes) =>
      nodes.forEach((node) => {
        node.posts.forEach((post) => map.set(post.id, node.path))
        walk(node.children)
      })
    walk(tree)
    return map
  }, [tree])

  const postId = Number(matchPath('/archive/:id', location.pathname)?.params.id)
  const revealKey = keyOf(postPaths.get(postId) ?? [])

  // 지금 보고 있는 글이 접힌 곳에 숨지 않도록, 글로 이동할 때 그 경로의 상위 분류를 펼친다.
  // (직접 접은 다른 분류는 건드리지 않는다.)
  useEffect(() => {
    const path = JSON.parse(revealKey)
    if (path.length === 0) return
    setOpenKeys((prev) => {
      const next = new Set(prev)
      for (let i = 1; i <= path.length; i++) next.add(keyOf(path.slice(0, i)))
      return next.size === prev.size ? prev : next
    })
  }, [revealKey])

  useEffect(() => {
    saveOpenKeys(openKeys)
  }, [openKeys])

  const toggle = useCallback((key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

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
        <Link to="/archive" className={`tree-all${onHome ? ' active' : ''}`}>
          Archive 홈
        </Link>

        {error && <p className="status status-error">분류를 불러오지 못했습니다.</p>}
        {!error && loading && <p className="status">불러오는 중...</p>}

        {tree.map((node) => (
          <TreeNode key={node.name} node={node} depth={0} openKeys={openKeys} onToggle={toggle} />
        ))}
      </nav>
    </aside>
  )
}

export default ArchiveSidebar
