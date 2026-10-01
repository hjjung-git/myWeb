import { createContext, useContext, useState } from 'react'

const ActiveSectionContext = createContext(null)

// 지금 스크롤 중인 섹션이 어디인지 공유 — Home(관찰하는 쪽)과 TabNav(표시하는 쪽)가 같이 쓴다.
export function ActiveSectionProvider({ children }) {
  const [activeId, setActiveId] = useState('about')
  return (
    <ActiveSectionContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </ActiveSectionContext.Provider>
  )
}

export function useActiveSection() {
  const ctx = useContext(ActiveSectionContext)
  if (!ctx) throw new Error('useActiveSection은 ActiveSectionProvider 안에서만 사용할 수 있다.')
  return ctx
}
