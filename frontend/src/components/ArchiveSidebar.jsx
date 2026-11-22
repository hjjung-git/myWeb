import { useEffect, useMemo } from 'react'
import { NavLink, matchPath, useLocation } from 'react-router-dom'
import { keyOf, useOpenKeys } from '../lib/useOpenKeys.js'
import SideDrawer from './SideDrawer.jsx'

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

// Archive 왼쪽 사이드바(Notes) — 대분류 > 중분류 > 소분류 > 글 제목 트리. 접힘·서랍 동작은 SideDrawer.
function ArchiveSidebar({ tree, loading, error }) {
  const location = useLocation()
  const [openKeys, toggle, reveal] = useOpenKeys('archive-tree-open')

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
    reveal(path.map((_, i) => keyOf(path.slice(0, i + 1))))
  }, [revealKey, reveal])

  return (
    <SideDrawer side="left" id="archive-drawer" title="Notes" openLabel="Notes 카테고리 열기">
      <nav className="archive-tree" aria-label="Notes 카테고리">
        {error && <p className="status status-error">분류를 불러오지 못했습니다.</p>}
        {!error && loading && <p className="status">불러오는 중...</p>}

        {tree.map((node) => (
          <TreeNode key={node.name} node={node} depth={0} openKeys={openKeys} onToggle={toggle} />
        ))}
      </nav>
    </SideDrawer>
  )
}

export default ArchiveSidebar
