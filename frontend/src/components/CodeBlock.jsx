import { useEffect, useRef, useState } from 'react'
import MermaidBlock from './MermaidBlock.jsx'

// hast 노드에서 글자만 모은다(문법 강조로 <span>이 많이 끼어 있어도 원문 그대로)
function textOf(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  return (node.children || []).map(textOf).join('')
}

// 클립보드 복사 — 보안 컨텍스트가 아니거나 권한이 없으면 숨은 textarea로 대신 복사한다.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

// 마크다운의 <pre> 자리에 들어가는 컴포넌트 — ```mermaid는 그림으로, 나머지 코드 블록은 언어 이름 + 복사 버튼을 붙여 보여 준다.
function CodeBlock({ node, children, ...rest }) {
  const codeEl = node?.children?.[0]
  const classes = codeEl?.properties?.className || []
  const lang = classes.find((c) => typeof c === 'string' && c.startsWith('language-'))?.slice('language-'.length)
  const text = textOf(codeEl).replace(/\n$/, '')
  const [state, setState] = useState('idle') // idle | copied | failed
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  if (codeEl?.tagName === 'code' && lang === 'mermaid') return <MermaidBlock code={text.trim()} />

  async function handleCopy() {
    const ok = await copyText(text)
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }

  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span className="code-block-lang">{lang || 'code'}</span>
        <button type="button" className="code-copy" onClick={handleCopy} aria-label="코드 복사" aria-live="polite">
          {state === 'copied' ? '복사됨' : state === 'failed' ? '복사 실패' : '복사'}
        </button>
      </div>
      <pre {...rest}>{children}</pre>
    </div>
  )
}

export default CodeBlock
