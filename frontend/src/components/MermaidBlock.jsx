import { useEffect, useState } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { renderMermaid } from '../lib/mermaid.js'

// 글 화면에서 ```mermaid 블록을 그림으로 보여준다. 문법이 틀리면 원문과 오류를 그대로 보여준다.
function MermaidBlock({ code }) {
  const { theme } = useTheme()
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    renderMermaid(code)
      .then((result) => {
        if (!cancelled) setSvg(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '그림을 그리지 못했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [code, theme])

  if (error) {
    return (
      <div className="mermaid-error">
        <p>Mermaid 문법 오류: {error}</p>
        <pre><code>{code}</code></pre>
      </div>
    )
  }
  if (!svg) return <div className="mermaid-block mermaid-loading">그림 불러오는 중…</div>
  // svg는 mermaid가 strict 모드로 만든 결과(스크립트 제거됨)라 그대로 넣는다.
  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} />
}

export default MermaidBlock
