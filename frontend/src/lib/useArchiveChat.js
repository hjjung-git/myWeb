import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiMutate } from './api.js'

// Archive 홈의 AI 질문 상태 — 쓸 수 있는지(status), 대화(turns), 질문 중인지(asking).
// 이전 대화는 최근 2턴만 서버로 보낸다(이어 묻기용). 새로고침하면 대화는 사라진다.
export function useArchiveChat() {
  const [status, setStatus] = useState(null)
  const [turns, setTurns] = useState([])
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    apiGet('/api/chat/status').then(setStatus).catch(() => setStatus({ available: false }))
  }, [])

  const ask = useCallback(
    async (question) => {
      const q = question.trim()
      if (!q || asking) return
      const history = turns.filter((t) => t.answer).slice(-2).map((t) => ({ question: t.question, answer: t.answer }))
      setTurns((prev) => [...prev, { question: q }])
      setAsking(true)
      try {
        const r = await apiMutate('/api/chat', 'POST', { question: q, history })
        setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, ...r } : t)))
      } catch (err) {
        setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, error: err.message } : t)))
      } finally {
        setAsking(false)
      }
    },
    [asking, turns],
  )

  const reset = useCallback(() => setTurns([]), [])

  return { status, turns, asking, ask, reset }
}
