import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { buildTree, flattenTree } from '../lib/archiveTree.js'
import ArchiveSidebar from '../components/ArchiveSidebar.jsx'

// Archive 공통 레이아웃 — 왼쪽은 카테고리 트리, 오른쪽은 목록(/archive) 또는 글(/archive/:id).
// 전체 글 요약은 여기서 한 번만 받아 사이드바와 하위 화면(목록 필터, 이전/다음 글)이 같이 쓴다.
function ArchiveLayout() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(
    () =>
      apiGet('/api/posts/index')
        .then((data) => {
          setPosts(data)
          setError(null)
        })
        .catch((err) => setError(err.message)),
    []
  )

  useEffect(() => {
    reload()
  }, [reload])

  const tree = useMemo(() => (posts ? buildTree(posts) : []), [posts])
  const ordered = useMemo(() => flattenTree(tree), [tree])

  return (
    <div className="archive-layout">
      <ArchiveSidebar tree={tree} loading={posts === null && !error} error={error} />
      <div className="archive-content">
        <Outlet context={{ posts, ordered, reload, indexError: error }} />
      </div>
    </div>
  )
}

export default ArchiveLayout
