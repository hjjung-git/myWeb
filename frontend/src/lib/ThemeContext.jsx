import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const THEME_KEY = 'myweb-theme'
const SIZE_KEY = 'myweb-font-size'
const MOTION_KEY = 'myweb-reduce-motion'

// 브라우저 저장소를 못 쓰는 환경(프라이빗 브라우징 등)이어도 화면은 정상 동작해야 하므로 읽기/쓰기를 감싼다.
function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장은 편의 기능이라 실패해도 그냥 넘어간다.
  }
}

const THEME_PREFS = ['system', 'light', 'dark']
const FONT_SIZES = ['sm', 'md', 'lg']
const mq = (query) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query) : null)

// 화면 설정(테마·글자 크기·움직임 줄이기)을 앱 전체에서 공유하고, 이 브라우저에 기억해 둔다.
//  - 테마: 시스템(기본, OS 설정을 따라 바뀜) / 라이트 / 다크
//  - 글자 크기: 작게 / 보통 / 크게 (html 글자 크기를 바꿔서 rem 기준 화면 전체가 같이 변한다)
//  - 움직임 줄이기: OS의 "동작 줄이기"가 켜져 있으면 기본으로 켜진다
export function ThemeProvider({ children }) {
  const [themePref, setThemePref] = useState(() => {
    const saved = read(THEME_KEY)
    return THEME_PREFS.includes(saved) ? saved : 'system'
  })
  const [systemDark, setSystemDark] = useState(() => Boolean(mq('(prefers-color-scheme: dark)')?.matches))
  const [fontSize, setFontSize] = useState(() => {
    const saved = read(SIZE_KEY)
    return FONT_SIZES.includes(saved) ? saved : 'md'
  })
  const [reduceMotion, setReduceMotion] = useState(() => {
    const saved = read(MOTION_KEY)
    if (saved === 'true' || saved === 'false') return saved === 'true'
    return Boolean(mq('(prefers-reduced-motion: reduce)')?.matches)
  })

  // OS 다크/라이트가 바뀌면 "시스템" 설정일 때 따라간다.
  useEffect(() => {
    const query = mq('(prefers-color-scheme: dark)')
    if (!query) return undefined
    const onChange = (e) => setSystemDark(e.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])

  const theme = themePref === 'system' ? (systemDark ? 'dark' : 'light') : themePref

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', reduceMotion)
  }, [reduceMotion])

  const value = {
    theme, // 지금 실제로 적용된 테마 ('light' | 'dark')
    themePref, // 고른 설정 ('system' | 'light' | 'dark')
    setThemePref: (pref) => {
      setThemePref(pref)
      write(THEME_KEY, pref)
    },
    fontSize,
    setFontSize: (size) => {
      setFontSize(size)
      write(SIZE_KEY, size)
    },
    reduceMotion,
    setReduceMotion: (on) => {
      setReduceMotion(on)
      write(MOTION_KEY, String(on))
    },
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme는 ThemeProvider 안에서만 사용할 수 있다.')
  return ctx
}
