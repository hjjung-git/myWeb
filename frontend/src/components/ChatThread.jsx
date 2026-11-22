import { Link } from 'react-router-dom'
import MarkdownView from './MarkdownView.jsx'

// AI 질문 대화 — 질문, 답변(마크다운), 근거 자료 목록([1] 번호와 같은 순서).
function ChatThread({ turns, asking, onReset }) {
  if (turns.length === 0) return null
  return (
    <div className="chat-thread" aria-live="polite">
      {turns.map((t, i) => (
        <article key={i} className="chat-turn">
          <p className="chat-question">{t.question}</p>
          {!t.answer && !t.error && asking && i === turns.length - 1 && (
            <p className="chat-pending">내 글과 코드에서 찾는 중...</p>
          )}
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
      {!asking && (
        <button type="button" className="chat-reset" onClick={onReset}>
          새 대화
        </button>
      )}
    </div>
  )
}

export default ChatThread
