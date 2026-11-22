import { useCallback, useEffect, useState } from 'react'

// 사이드바 트리에서 펼쳐 둔 항목을 기억한다(이 기기에서만 쓰는 편의 기능이라 저장에 실패해도 그냥 넘어간다).
export const keyOf = (path) => JSON.stringify(path)

function load(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return new Set(Array.isArray(saved) ? saved : [])
  } catch {
    return new Set()
  }
}

// [openKeys, toggle, reveal] — reveal(keys)는 주어진 항목들을 펼친다(지금 보는 글이 접힌 곳에 숨지 않게).
export function useOpenKeys(storageKey) {
  const [openKeys, setOpenKeys] = useState(() => load(storageKey))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...openKeys]))
    } catch {
      // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 기억만 포기한다.
    }
  }, [storageKey, openKeys])

  const toggle = useCallback((key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const reveal = useCallback((keys) => {
    if (keys.length === 0) return
    setOpenKeys((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => next.add(k))
      return next.size === prev.size ? prev : next
    })
  }, [])

  return [openKeys, toggle, reveal]
}
