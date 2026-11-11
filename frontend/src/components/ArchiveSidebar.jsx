import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, matchPath, useLocation, useSearchParams } from 'react-router-dom'
import { categoryLink, filterPathFrom } from '../lib/archiveTree.js'

// 펼쳐 둔 분류를 브라우저에 기억한다 (이 기기에서만 쓰는 편의 기능이라 실패해도 그냥 넘어간다).
const STORAGE_KEY = 'archive-tree-open'

const keyOf = (path) => JSON.stringify(path)

function samePath(a, b) {
  return a.length === b.length && a.every((name, i) => name === b[i])
}

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
// 접힌 분류는 ▼, 펼친 분류는 ▲ 버튼으로 표시한다.
function TreeNode({ node, depth, activePath, openKeys, onToggle }) {
  const key = keyOf(node.path)
  const isOpen = openKeys.has(key)
  const isActive = samePath(node.path, activePath)
  const label = `${node.name} ${isOpen ? '접기' : '펼치기'}`

  return (
    <div className={`tree-node tree-depth-${depth}`}>
      <div className="tree-row">
        <Link to={categoryLink(...node.path)} className={isActive ? 'active' : undefined}>
          {node.name}
        </Link>
        <button
          type="button"
          className="tree-toggle"
          onClick={() => onToggle(key)}
          aria-expanded={isOpen}
          aria-label={label}
          title={label}
        >
          <span aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>
      {isOpen && (
        <>
          <PostLinks posts={node.posts} />
          {node.children.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              openKeys={openKeys}
              onToggle={onToggle}
            />
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
  const [searchParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState(loadOpenKeys)

  // 다른 글/분류로 이동하면 모바일 메뉴는 닫는다.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  const onListPage = location.pathname === '/archive'
  const activePath = onListPage ? filterPathFrom(searchParams) : []

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
  const revealPath = onListPage ? activePath : (postPaths.get(postId) ?? [])
  const revealKey = keyOf(revealPath)

  // 지금 보고 있는 분류/글이 접힌 곳에 숨지 않도록, 이동할 때 그 경로의 상위 분류를 펼친다.
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
        <Link to="/archive" className={`tree-all${onListPage && activePath.length === 0 ? ' active' : ''}`}>
          전체 글
        </Link>

        {error && <p className="status status-error">분류를 불러오지 못했습니다.</p>}
        {!error && loading && <p className="status">불러오는 중...</p>}

        {tree.map((node) => (
          <TreeNode
            key={node.name}
            node={node}
            depth={0}
            activePath={activePath}
            openKeys={openKeys}
            onToggle={toggle}
          />
        ))}
      </nav>
    </aside>
  )
}

export default ArchiveSidebar
