import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MarkdownView from './MarkdownView.jsx'

function formatWhen(iso) {
  return iso ? new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
}

// 지난 대화 목록 — 첫 질문을 제목으로, 누르면 그 대화를 다시 연다(이어서 물을 수 있음)
export function ChatHistory({ past, onOpen, onRemove }) {
  if (past.length === 0) return null
  return (
    <ul className="chat-history" aria-label="지난 대화">
      {past.map((s) => (
        <li key={s.id}>
          <button type="button" className="chat-history-open" onClick={() => onOpen(s.id)}>
            <strong>{s.turns[0]?.question}</strong>
            <span>
              {formatWhen(s.startedAt)} · 질문 {s.turns.length}개
            </span>
          </button>
          <button type="button" className="chat-history-del" onClick={() => onRemove(s.id)} aria-label="이 대화 기록 지우기" title="기록 지우기">
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

// AI 질문 대화 — 위에 [새 대화 | 지난 대화], 아래는 대화만 따로 스크롤되는 칸(새 답이 오면 맨 아래로).
function ChatThread({ turns, asking, past, onReset, onOpen, onRemove }) {
  const scrollRef = useRef(null)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns, asking])

  return (
    <div className="chat-panel">
      <div className="chat-bar">
        <button type="button" className="chat-bar-btn" onClick={onReset} disabled={asking}>
          새 대화
        </button>
        {past.length > 0 && (
          <button type="button" className={`chat-bar-btn${showPast ? ' is-on' : ''}`} onClick={() => setShowPast((v) => !v)} aria-expanded={showPast}>
            지난 대화 {past.length}
          </button>
        )}
      </div>
      {showPast && (
        <ChatHistory
          past={past}
          onOpen={(id) => {
            setShowPast(false)
            onOpen(id)
          }}
          onRemove={onRemove}
        />
      )}

      <div className="chat-scroll" ref={scrollRef} aria-live="polite">
        {turns.map((t, i) => (
          <article key={i} className="chat-turn">
            <p className="chat-question">{t.question}</p>
            {!t.answer && !t.error && asking && i === turns.length - 1 && <p className="chat-pending">내 글과 코드에서 찾는 중...</p>}
            {t.error && <p className="status status-error">{t.error}</p>}
            {t.answer && (
              <div className="chat-answer">
                <MarkdownView>{t.answer}</MarkdownView>
                {t.sources?.length > 0 && (
                  <ol className="chat-sources">
                    {t.sources.map((s) => (
                      <li key={s.n} value={s.n}>
                        <Link to={s.url}>{s.title}</Link>
                        <span>
                          {s.type === 'note' ? 'Notes' : 'Codebase'}
                          {s.category ? ` › ${s.category}` : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {t.model && (
                  <p className="chat-meta">
                    {t.model} · 입력 {t.inputTokens} · 출력 {t.outputTokens} 토큰
                  </p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export default ChatThread
