import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { buildTree, flattenTree } from '../lib/archiveTree.js'
import ArchiveSidebar from '../components/ArchiveSidebar.jsx'
import CodebaseSidebar from '../components/CodebaseSidebar.jsx'

// Archive 공통 레이아웃 — [Notes 트리 | 가운데 | Codebase 트리].
// 가운데는 Archive 홈(통합 검색, /archive), 글(/archive/:id), 코드(/codebase/:id) 중 하나. 검색·둘러보기는 모두 Archive 홈에서 한다.
// 글 요약과 코드 목록은 여기서 한 번만 받아 양쪽 사이드바와 하위 화면(통합 검색, 이전/다음 글)이 같이 쓴다.
function ArchiveLayout() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)
  const [snippets, setSnippets] = useState(null)
  const [snippetError, setSnippetError] = useState(null)

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
    apiGet('/api/snippets').then(setSnippets).catch((err) => setSnippetError(err.message))
  }, [reload])

  const tree = useMemo(() => (posts ? buildTree(posts) : []), [posts])
  const ordered = useMemo(() => flattenTree(tree), [tree])

  return (
    <div className="archive-layout">
      <ArchiveSidebar tree={tree} loading={posts === null && !error} error={error} />
      <div className="archive-content">
        <Outlet context={{ posts, ordered, reload, indexError: error, snippets, snippetError }} />
      </div>
      <CodebaseSidebar snippets={snippets} error={snippetError} />
    </div>
  )
}

export default ArchiveLayout
