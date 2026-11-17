import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ActiveSectionContext = createContext(null)

// 지금 스크롤 중인 섹션이 어디인지 공유 — Home(관찰하는 쪽)과 TabNav·FloatingNav(표시하는 쪽)가 같이 쓴다.
// 탭을 눌러 이동한 섹션(pin)은 사용자가 직접 스크롤하기 전까지 그대로 표시한다.
// (맨 아래 짧은 섹션들은 눌러도 그 섹션 시작 위치까지 못 올라오는 경우가 있어서, 스크롤 위치만으로는 고른 탭이 선택되지 않는다.)
export function ActiveSectionProvider({ children }) {
  const [activeId, setActiveId] = useState('about')
  const pinRef = useRef(null)

  const pinActive = useCallback((id) => {
    pinRef.current = id
    setActiveId(id)
  }, [])
  const clearPin = useCallback(() => {
    pinRef.current = null
  }, [])
  const getPin = useCallback(() => pinRef.current, [])

  const value = useMemo(
    () => ({ activeId, setActiveId, pinActive, clearPin, getPin }),
    [activeId, pinActive, clearPin, getPin]
  )
  return <ActiveSectionContext.Provider value={value}>{children}</ActiveSectionContext.Provider>
}

export function useActiveSection() {
  const ctx = useContext(ActiveSectionContext)
  if (!ctx) throw new Error('useActiveSection은 ActiveSectionProvider 안에서만 사용할 수 있다.')
  return ctx
}
