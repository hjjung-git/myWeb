import { createContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './sidenote.css'

// 우측 여백 메모 칸 — 본문(.sn-main)과 메모 칸(.sn-aside)을 나란히 놓는 2단 레이아웃.
// 넓은 화면: 메모는 본문 밖의 오른쪽 칸에 놓이고, 각 메모의 높이는 번호가 달린 문단에 맞춘다(겹치면 아래로 밀린다).
// 좁은 화면: 오른쪽 칸이 없으므로 번호를 누르면 그 자리에서 펼쳐진다.
export const SidenoteContext = createContext(null)

const WIDE = '(min-width: 1360px)'

function SidenoteLayout({ enabled, children }) {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(WIDE).matches)
  const [asideEl, setAsideEl] = useState(null)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined
    const mq = window.matchMedia(WIDE)
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [enabled])

  // 메모를 번호가 달린 문단 높이에 맞춰 놓는다. 이전 메모와 겹치면 그 아래로 민다.
  useLayoutEffect(() => {
    if (!enabled || !wide || !asideEl || !rootRef.current) return undefined
    const root = rootRef.current
    const place = () => {
      const base = asideEl.getBoundingClientRect().top
      let bottom = 0
      asideEl.querySelectorAll(':scope > .sidenote').forEach((note) => {
        const mark = root.querySelector(`.sn-mark[data-n="${note.dataset.n}"]`)
        if (!mark) return
        const top = Math.max(mark.getBoundingClientRect().top - base, bottom)
        note.style.top = `${top}px`
        bottom = top + note.offsetHeight + 12
      })
      asideEl.style.minHeight = `${bottom}px`
    }
    place()
    // 이미지가 늦게 뜨거나 창 폭이 바뀌어 본문 높이가 달라지면 다시 놓는다.
    const ro = new ResizeObserver(place)
    ro.observe(root.querySelector('.sn-main'))
    return () => ro.disconnect()
  }, [enabled, wide, asideEl, children])

  if (!enabled) return children
  return (
    <SidenoteContext.Provider value={{ wide, asideEl }}>
      <div className={'sn-layout' + (wide ? ' is-wide' : '')} ref={rootRef}>
        <div className="sn-main">{children}</div>
        {wide && <aside className="sn-aside" ref={setAsideEl} aria-label="용어 메모" />}
      </div>
    </SidenoteContext.Provider>
  )
}

export default SidenoteLayout
