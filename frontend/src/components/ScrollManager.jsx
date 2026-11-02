import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// 화면별 스크롤 위치를 기억했다가, "돌아왔을 때" 보던 위치를 그대로 복원한다.
//  - 뒤로가기(POP) 또는 state.restoreScroll 링크(상세 화면의 "← 목록으로" 등)로 돌아오면 → 기억한 위치
//  - 그 외에 #섹션이 붙은 이동(상단 탭 등)이면 → 해당 섹션
//  - 그 외 새 화면 이동이면 → 맨 위
// 홈은 목록 데이터를 비동기로 불러와서 처음엔 페이지가 짧으므로, 내용이 다 그려질 때까지
// 잠깐(최대 1.5초) 기다리며 위치를 맞춘다. 그 사이 사용자가 직접 스크롤하면 바로 멈춘다.
const savedPositions = new Map() // "pathname+search" -> scrollY

const WAIT_MS = 1500
const USER_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown']

function scrollWhenReady(getTarget) {
  let stopped = false
  let frame = 0
  const start = performance.now()

  function stop() {
    stopped = true
    cancelAnimationFrame(frame)
    USER_EVENTS.forEach((ev) => window.removeEventListener(ev, stop))
  }
  USER_EVENTS.forEach((ev) => window.addEventListener(ev, stop, { passive: true }))

  function tick() {
    if (stopped) return
    const elapsed = performance.now() - start
    const target = getTarget()

    if (target?.element) {
      target.element.scrollIntoView({ behavior: 'smooth' })
      stop()
      return
    }
    if (typeof target?.y === 'number') {
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, Math.max(0, Math.min(target.y, maxY)))
      if (maxY >= target.y) {
        stop()
        return
      }
    }
    if (elapsed > WAIT_MS) {
      stop()
      return
    }
    frame = requestAnimationFrame(tick)
  }

  tick()
  return stop
}

function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const pathKey = location.pathname + location.search

  // 브라우저 기본 복원은 비동기로 그려지는 내용과 어긋나서 직접 관리한다.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // 현재 화면의 스크롤 위치를 계속 기록한다. useLayoutEffect인 이유: 화면이 바뀌어 페이지가 짧아질 때
  // 브라우저가 스크롤을 줄이면서 보내는 scroll 이벤트가 "이전 화면"의 기록을 덮어쓰지 않도록,
  // 새 화면이 그려지기 전에 이전 화면의 리스너를 먼저 떼어낸다.
  useLayoutEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => savedPositions.set(pathKey, window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [pathKey])

  useEffect(() => {
    const wantsRestore = navigationType === 'POP' || location.state?.restoreScroll
    const savedY = savedPositions.get(pathKey) // 기다리는 동안 덮어써지지 않게 지금 값을 잡아둔다
    const sectionId = location.hash ? decodeURIComponent(location.hash.slice(1)) : null

    if (wantsRestore && savedY !== undefined) {
      return scrollWhenReady(() => ({ y: savedY }))
    }
    if (sectionId) {
      return scrollWhenReady(() => {
        const element = document.getElementById(sectionId)
        return element ? { element } : null
      })
    }
    window.scrollTo(0, 0)
    return undefined
    // location.key가 바뀔 때(= 실제로 이동했을 때)만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  return null
}

export default ScrollManager
