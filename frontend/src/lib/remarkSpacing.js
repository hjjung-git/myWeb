// 글 화면(react-markdown)에서 줄바꿈과 문단 간격을 작성한 그대로 보여주기 위한 remark 플러그인.
// Obsidian 읽기 화면과 같은 규칙으로 맞춘다.
//  1) 문단 안에서 Enter 한 번  → 실제 줄바꿈 (markdown 기본은 띄어쓰기로 합쳐짐)
//  2) 빈 줄을 여러 개 띄우면   → 그만큼 문단 사이 간격을 더 띄움 (기본은 몇 개든 한 칸)
//  3) <br>                      → 문단 안에서는 줄바꿈, 한 줄에 단독으로 쓰면 빈 줄 하나
// 코드 블록·인라인 코드는 text 노드가 아니라서 건드리지 않는다.

function spacer() {
  return { type: 'paragraph', data: { hName: 'div', hProperties: { className: ['md-spacer'] } }, children: [] }
}

function isBrTag(value) {
  return /^<br\s*\/?>$/i.test(value.trim())
}

function convertBreaks(node) {
  if (!Array.isArray(node.children)) return
  const out = []
  for (const child of node.children) {
    if (child.type === 'text' && child.value.includes('\n')) {
      child.value.split('\n').forEach((part, i) => {
        if (i > 0) out.push({ type: 'break' })
        if (part) out.push({ type: 'text', value: part })
      })
      continue
    }
    if (child.type === 'html' && isBrTag(child.value)) {
      out.push(node.type === 'root' ? spacer() : { type: 'break' })
      continue
    }
    convertBreaks(child)
    out.push(child)
  }
  node.children = out
}

function addSpacers(root) {
  const out = []
  root.children.forEach((child, i) => {
    out.push(child)
    const next = root.children[i + 1]
    const end = child.position?.end?.line
    const start = next?.position?.start?.line
    if (end && start) {
      // 블록 사이 빈 줄 수 - 1(기본 문단 간격) 만큼 간격을 추가한다.
      const extra = start - end - 2
      for (let k = 0; k < extra; k++) out.push(spacer())
    }
  })
  root.children = out
}

export default function remarkSpacing() {
  return (tree) => {
    addSpacers(tree) // 위치 정보(position)가 남아 있을 때 먼저 계산
    convertBreaks(tree)
  }
}
