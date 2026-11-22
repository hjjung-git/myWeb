import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiMutate } from './api.js'

// Archive 홈의 AI 질문 상태 — 쓸 수 있는지(status), 지금 대화(session), 지난 대화(past), 질문 중인지(asking).
// 대화는 이 브라우저에 저장된다(localStorage) — 새로고침하거나 다시 들어와도 이어서 보고, 지난 대화도 다시 연다.
// 서버로는 이어 묻기용으로 최근 2턴만 보낸다.
const STORE = 'archive-chat-v1'
const MAX_PAST = 20

const newSession = () => ({ id: Date.now().toString(36), startedAt: new Date().toISOString(), turns: [] })
// 답을 기다리던 중에 닫힌 질문은 저장하지 않는다
const finished = (turns) => (turns ?? []).filter((t) => t && t.question && (t.answer || t.error))

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
    if (!saved) return { session: newSession(), past: [] }
    const session = saved.current?.id ? { ...saved.current, turns: finished(saved.current.turns) } : newSession()
    const past = Array.isArray(saved.past) ? saved.past.filter((s) => s?.id && finished(s.turns).length > 0) : []
    return { session, past }
  } catch {
    return { session: newSession(), past: [] }
  }
}

export function useArchiveChat() {
  const [status, setStatus] = useState(null)
  const [store, setStore] = useState(load)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    apiGet('/api/chat/status').then(setStatus).catch(() => setStatus({ available: false }))
  }, [])

  // 바뀔 때마다 저장(저장이 안 되는 환경이면 화면에서만 유지)
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ current: { ...store.session, turns: finished(store.session.turns) }, past: store.past }))
    } catch {
      // 사생활 보호 모드 등 — 기록만 포기
    }
  }, [store])

  const updateLast = (patch) =>
    setStore((s) => {
      const turns = s.session.turns.map((t, i) => (i === s.session.turns.length - 1 ? { ...t, ...patch } : t))
      return { ...s, session: { ...s.session, turns } }
    })

  const ask = useCallback(
    async (question) => {
      const q = question.trim()
      if (!q || asking) return
      const history = finished(store.session.turns)
        .filter((t) => t.answer)
        .slice(-2)
        .map((t) => ({ question: t.question, answer: t.answer }))
      setStore((s) => ({ ...s, session: { ...s.session, turns: [...s.session.turns, { question: q, askedAt: new Date().toISOString() }] } }))
      setAsking(true)
      try {
        updateLast(await apiMutate('/api/chat', 'POST', { question: q, history }))
      } catch (err) {
        updateLast({ error: err.message })
      } finally {
        setAsking(false)
      }
    },
    [asking, store.session.turns],
  )

  // 새 대화: 지금 대화는 지난 대화 목록 맨 위로 옮기고 빈 대화를 시작한다
  const reset = useCallback(() => {
    if (asking) return
    setStore((s) => {
      const turns = finished(s.session.turns)
      const past = turns.length > 0 ? [{ ...s.session, turns }, ...s.past].slice(0, MAX_PAST) : s.past
      return { session: newSession(), past }
    })
  }, [asking])

  // 지난 대화 열기: 지금 대화(비어 있지 않으면)는 목록으로, 고른 대화는 지금 대화로 — 이어서 물을 수 있다
  const open = useCallback(
    (id) => {
      if (asking) return
      setStore((s) => {
        const chosen = s.past.find((p) => p.id === id)
        if (!chosen) return s
        const turns = finished(s.session.turns)
        const rest = s.past.filter((p) => p.id !== id)
        const past = turns.length > 0 ? [{ ...s.session, turns }, ...rest].slice(0, MAX_PAST) : rest
        return { session: chosen, past }
      })
    },
    [asking],
  )

  const remove = useCallback((id) => setStore((s) => ({ ...s, past: s.past.filter((p) => p.id !== id) })), [])

  return { status, turns: store.session.turns, past: store.past, asking, ask, reset, open, remove }
}
