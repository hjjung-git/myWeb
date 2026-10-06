import { useEffect, useRef } from 'react'
import { EditorState, EditorSelection, Prec, RangeSetBuilder } from '@codemirror/state'
import { EditorView, Decoration, ViewPlugin, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { syntaxTree } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'

// Obsidian의 "Live Preview"와 같은 방식 — CodeMirror 6(Obsidian이 실제로 쓰는 에디터 엔진) 위에,
// 커서가 있는 줄은 markdown 원문(#, **, ` 등)이 그대로 보이고, 커서가 벗어난 줄은 그 기호가
// 사라지면서 서식(제목 크기, 굵게, 인라인 코드 배경 등)만 남는 decoration을 얹었다.
//
// 저장되는 값은 항상 EditorView의 실제 문서(순수 markdown 텍스트)이고, 이 꾸밈은 화면에만 적용되는
// decoration이라 DB/API에는 전혀 영향이 없다 — onChange로 올라가는 값도 항상 원문 그대로다.
//
// 코드블록 내부 줄과 표, 목록 기호(-, 1.)는 이번엔 "항상 그대로 보이는" 수준으로만 다루고,
// 완전한 렌더링(진짜 표, 코드 하이라이트)은 저장 후 보는 화면(ArchiveDetail, react-markdown)에서
// 보장된다.

function lineOverlaps(state, pos, sel) {
  const line = state.doc.lineAt(pos)
  return sel.from <= line.to && sel.to >= line.from
}

function buildDecorations(view) {
  const state = view.state
  const sel = state.selection.main
  const items = []

  function hide(from, to) {
    if (to > from) items.push({ from, to, deco: Decoration.replace({}) })
  }
  function style(from, to, className) {
    if (to > from) items.push({ from, to, deco: Decoration.mark({ class: className }) })
  }

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(nodeRef) {
        const node = nodeRef.node
        const name = node.type.name

        if (name.startsWith('ATXHeading')) {
          const level = Number(name.slice('ATXHeading'.length)) || 1
          const mark = node.getChild('HeaderMark')
          if (mark) {
            const afterText = state.doc.sliceString(mark.to, node.to)
            const spaceLen = (afterText.match(/^\s*/) || [''])[0].length
            const contentFrom = mark.to + spaceLen
            style(contentFrom, node.to, `cm-heading cm-heading-${Math.min(level, 6)}`)
            if (!lineOverlaps(state, mark.from, sel)) {
              hide(mark.from, contentFrom)
            } else {
              style(mark.from, mark.to, 'cm-mark')
            }
          }
          return
        }

        if (name === 'StrongEmphasis' || name === 'Emphasis') {
          const marks = node.getChildren('EmphasisMark')
          if (marks.length >= 2) {
            const m1 = marks[0]
            const m2 = marks[marks.length - 1]
            style(m1.to, m2.from, name === 'StrongEmphasis' ? 'cm-strong' : 'cm-em')
            const active = lineOverlaps(state, m1.from, sel) || lineOverlaps(state, m2.from, sel)
            if (!active) {
              hide(m1.from, m1.to)
              hide(m2.from, m2.to)
            } else {
              style(m1.from, m1.to, 'cm-mark')
              style(m2.from, m2.to, 'cm-mark')
            }
          }
          return
        }

        if (name === 'InlineCode') {
          const marks = node.getChildren('CodeMark')
          if (marks.length >= 2) {
            const m1 = marks[0]
            const m2 = marks[marks.length - 1]
            style(m1.to, m2.from, 'cm-inline-code')
            const active = lineOverlaps(state, m1.from, sel) || lineOverlaps(state, m2.from, sel)
            if (!active) {
              hide(m1.from, m1.to)
              hide(m2.from, m2.to)
            } else {
              style(m1.from, m1.to, 'cm-mark')
              style(m2.from, m2.to, 'cm-mark')
            }
          }
          return
        }

        if (name === 'QuoteMark') {
          style(node.from, node.to, 'cm-quote-mark')
          const line = state.doc.lineAt(node.from)
          style(node.to, line.to, 'cm-quote-text')
          return
        }

        if (name === 'HorizontalRule') {
          style(node.from, node.to, lineOverlaps(state, node.from, sel) ? 'cm-mark' : 'cm-hr')
          return
        }

        if (name === 'Link') {
          const marks = node.getChildren('LinkMark')
          if (marks.length >= 2) {
            style(marks[0].to, marks[1].from, 'cm-link-text')
          }
          return
        }

        if (name === 'LinkMark' || name === 'URL') {
          if (!lineOverlaps(state, node.from, sel)) {
            hide(node.from, node.to)
          } else {
            style(node.from, node.to, 'cm-mark')
          }
          return
        }

        if (name === 'CodeMark' && node.parent && node.parent.type.name === 'FencedCode') {
          style(node.from, node.to, 'cm-fence-mark')
          return
        }
        if (name === 'CodeText') {
          style(node.from, node.to, 'cm-code-text')
          return
        }
      },
    })
  }

  items.sort((a, b) => a.from - b.from || a.to - b.to)
  const builder = new RangeSetBuilder()
  for (const { from, to, deco } of items) {
    builder.add(from, to, deco)
  }
  return builder.finish()
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = buildDecorations(view)
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations },
)

// ---- 서식 단축키 ----
// 선택 영역(또는 커서 위치)을 markdown 기호로 감싸거나 벗겨내는 토글 커맨드.
// changeByRange를 쓰면 다중 선택(커서 여러 개)이 있어도 CodeMirror가 알아서 각 range의
// 위치 보정을 해준다 — 직접 오프셋 계산을 안 해도 된다.
function toggleWrap(before, after = before) {
  return (view) => {
    const tr = view.state.changeByRange((range) => {
      const { state } = view
      const { from, to } = range
      const beforeText = state.sliceDoc(Math.max(0, from - before.length), from)
      const afterText = state.sliceDoc(to, to + after.length)
      if (beforeText === before && afterText === after) {
        return {
          changes: [
            { from: from - before.length, to: from, insert: '' },
            { from: to, to: to + after.length, insert: '' },
          ],
          range: EditorSelection.range(from - before.length, to - before.length),
        }
      }
      const selected = state.sliceDoc(from, to)
      return {
        changes: { from, to, insert: before + selected + after },
        range:
          from === to
            ? EditorSelection.cursor(from + before.length)
            : EditorSelection.range(from + before.length, to + before.length),
      }
    })
    view.dispatch(tr, { scrollIntoView: true, userEvent: 'input' })
    return true
  }
}

// 현재 줄 맨 앞의 "#{1,6} "을 지정한 level로 바꾼다. 이미 같은 level이면 제목을 해제(토글)한다.
function setHeading(level) {
  return (view) => {
    const tr = view.state.changeByRange((range) => {
      const line = view.state.doc.lineAt(range.head)
      const match = /^(#{1,6})\s+/.exec(line.text)
      const marker = `${'#'.repeat(level)} `
      if (match && match[1].length === level) {
        return {
          changes: { from: line.from, to: line.from + match[0].length, insert: '' },
          range: EditorSelection.cursor(Math.max(line.from, range.head - match[0].length)),
        }
      }
      const oldLen = match ? match[0].length : 0
      return {
        changes: { from: line.from, to: line.from + oldLen, insert: marker },
        range: EditorSelection.cursor(range.head - oldLen + marker.length),
      }
    })
    view.dispatch(tr, { scrollIntoView: true, userEvent: 'input' })
    return true
  }
}

// 선택한 텍스트를 링크 표기로 감싼다. 선택이 있으면 그 텍스트를 링크 텍스트로 쓰고 url 자리가
// 바로 선택된 상태로 남아 이어서 주소를 타이핑할 수 있다. 선택이 없으면 [](url) 형태를 넣고
// 대괄호 안에 커서를 둔다.
function insertLink(view) {
  const tr = view.state.changeByRange((range) => {
    const { from, to } = range
    const selected = view.state.sliceDoc(from, to)
    if (selected) {
      const insert = `[${selected}](url)`
      const urlFrom = from + selected.length + 3
      return {
        changes: { from, to, insert },
        range: EditorSelection.range(urlFrom, urlFrom + 3),
      }
    }
    return {
      changes: { from, to, insert: '[](url)' },
      range: EditorSelection.cursor(from + 1),
    }
  })
  view.dispatch(tr, { scrollIntoView: true, userEvent: 'input' })
  return true
}

const formatKeymap = Prec.highest(
  keymap.of([
    { key: 'Mod-b', run: toggleWrap('**') },
    { key: 'Mod-i', run: toggleWrap('*') },
    { key: 'Mod-e', run: toggleWrap('`') },
    { key: 'Mod-Shift-x', run: toggleWrap('~~') },
    { key: 'Mod-k', run: insertLink },
    { key: 'Mod-1', run: setHeading(1) },
    { key: 'Mod-2', run: setHeading(2) },
    { key: 'Mod-3', run: setHeading(3) },
  ]),
)

function MarkdownLiveEditor({ initialValue, onChange, placeholder: placeholderText }) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const state = EditorState.create({
      doc: initialValue || '',
      extensions: [
        history(),
        formatKeymap,
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        markdown(),
        EditorView.lineWrapping,
        livePreviewPlugin,
        placeholderExt(placeholderText || ''),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
      ],
    })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // 마운트될 때 한 번만 EditorView를 만든다 — 이후 content 동기화는 onChange로 밖으로만 흘러나가고,
    // 글 전환(id 변경) 시에는 ArchiveForm에서 key={id || 'new'}를 줘서 이 컴포넌트를 통째로 새로
    // 마운트하는 방식으로 처리한다(React가 알아서 이전 걸 destroy하고 새로 생성).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className="mle mle-cm" ref={containerRef} />
}

export default MarkdownLiveEditor
