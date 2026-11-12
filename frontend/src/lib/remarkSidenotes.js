// 각주 문법을 "우측 여백 메모"로 바꾸는 remark 플러그인. remarkGfm 뒤, remarkSpacing 앞에 둔다.
//
//   본문에서:  비트 단위로 다루는 값을 정수[^정수]라 한다.
//   글 맨 아래: [^정수]: **정수**: 소수점이 없는 수 …
//
// 위처럼 쓰면 [^정수] 자리에 번호가 붙고, 아래 정의는 같은 번호의 메모가 되어 그 문단 옆에 놓인다.
// (GitHub 같은 일반 마크다운 화면에서는 평범한 각주로 보이므로 글이 깨지지 않는다.)
// 정의가 없는 [^이름]은 그대로 두고, 정의 쪽은 본문에서 지운다(화면 맨 아래 각주 목록이 생기지 않게).

function collectDefinitions(node, defs) {
  if (!Array.isArray(node.children)) return
  node.children = node.children.filter((child) => {
    if (child.type === 'footnoteDefinition') {
      defs.set(child.identifier, child)
      return false
    }
    collectDefinitions(child, defs)
    return true
  })
}

// 정의 안의 문단들을 인라인 노드 한 줄로 이어 붙인다(문단 사이는 공백 하나).
function inlineOf(def) {
  const out = []
  for (const block of def.children) {
    if (block.type !== 'paragraph') continue
    if (out.length) out.push({ type: 'text', value: ' ' })
    out.push(...block.children)
  }
  return out
}

function replaceReferences(node, defs, state) {
  if (!Array.isArray(node.children)) return
  node.children = node.children.map((child) => {
    if (child.type === 'footnoteReference' && defs.has(child.identifier)) {
      state.count += 1
      return {
        type: 'sidenote',
        data: { hName: 'sidenote', hProperties: { dataN: state.count } },
        children: structuredClone(inlineOf(defs.get(child.identifier))),
      }
    }
    replaceReferences(child, defs, state)
    return child
  })
}

export default function remarkSidenotes() {
  return (tree) => {
    const defs = new Map()
    collectDefinitions(tree, defs)
    if (defs.size === 0) return
    replaceReferences(tree, defs, { count: 0 })
  }
}
