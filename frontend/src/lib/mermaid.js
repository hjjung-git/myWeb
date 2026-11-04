// markdown 안의 ```mermaid 코드 블록을 SVG 그림으로 바꾸는 공통 헬퍼.
// 글 화면(ArchiveDetail)과 작성 화면(MarkdownLiveEditor)이 같이 쓴다.
// mermaid는 용량이 커서 처음 그림이 필요할 때만 불러온다(동적 import).
let mermaidPromise = null
let renderCount = 0

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((module) => module.default)
  }
  return mermaidPromise
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default'
}

// 성공하면 SVG 문자열을, 문법 오류면 예외를 던진다.
export async function renderMermaid(code) {
  const mermaid = await loadMermaid()
  // 라이트/다크 테마가 바뀌었을 수 있으니 그릴 때마다 현재 테마로 맞춘다.
  // securityLevel 'strict': 그림 안의 HTML/스크립트를 막는다.
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: currentTheme() })
  const id = `mermaid-${Date.now()}-${renderCount++}`
  try {
    const { svg } = await mermaid.render(id, code)
    return svg
  } finally {
    // 문법 오류일 때 mermaid가 body에 남기는 임시 요소 정리
    document.getElementById(`d${id}`)?.remove()
    document.getElementById(id)?.remove()
  }
}
