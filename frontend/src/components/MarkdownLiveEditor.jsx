import { useEffect, useRef } from 'react'
import { EditorState, EditorSelection, Prec, RangeSetBuilder, StateField } from '@codemirror/state'
import { EditorView, Decoration, ViewPlugin, WidgetType, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { syntaxTree } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import { resolveImageSrc } from '../lib/api.js'
import { renderMermaid } from '../lib/mermaid.js'

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

// 업로드가 끝나기 전 문서에 잠깐 들어가는 자리표시 URL의 접두어
const UPLOADING_PREFIX = 'uploading:'

// 커서가 없는 줄의 ![설명](주소)를 실제 이미지로 바꿔 보여주는 위젯 (Obsidian Live Preview처럼)
class ImageWidget extends WidgetType {
  constructor(src, alt) {
    super()
    this.src = src
    this.alt = alt
  }

  eq(other) {
    return other.src === this.src && other.alt === this.alt
  }

  toDOM() {
    const wrap = document.createElement('span')
    wrap.className = 'cm-image-widget'
    if (this.src.startsWith(UPLOADING_PREFIX)) {
      wrap.classList.add('cm-image-uploading')
      wrap.textContent = `이미지 업로드 중… (${this.alt})`
      return wrap
    }
    const img = document.createElement('img')
    img.src = resolveImageSrc(this.src)
    img.alt = this.alt
    img.loading = 'lazy'
    wrap.appendChild(img)
    return wrap
  }

  ignoreEvent() {
    return false
  }
}

// 커서가 없는 ```mermaid 블록을 통째로 그림으로 바꿔 보여주는 위젯
class MermaidWidget extends WidgetType {
  constructor(code) {
    super()
    this.code = code
  }

  eq(other) {
    return other.code === this.code
  }

  toDOM() {
    const wrap = document.createElement('div')
    wrap.className = 'cm-mermaid-widget'
    wrap.textContent = '그림 불러오는 중…'
    renderMermaid(this.code)
      .then((svg) => {
        wrap.innerHTML = svg
      })
      .catch((err) => {
        wrap.classList.add('cm-mermaid-error')
        wrap.textContent = `Mermaid 문법 오류 — 클릭해서 수정: ${err?.message || ''}`
      })
    return wrap
  }

  ignoreEvent() {
    return false // 그림을 클릭하면 그 위치로 커서가 들어가서 원문 편집으로 돌아간다
  }
}

// 여러 줄을 통째로 바꾸는 "블록" 위젯은 ViewPlugin이 아니라 StateField로만 넣을 수 있어서 따로 둔다.
function buildMermaidDecorations(state) {
  const sel = state.selection.main
  const builder = new RangeSetBuilder()
  syntaxTree(state).iterate({
    enter(nodeRef) {
      if (nodeRef.name !== 'FencedCode') return
      const node = nodeRef.node
      const info = node.getChild('CodeInfo')
      const lang = info ? state.sliceDoc(info.from, info.to).trim() : ''
      if (lang === 'mermaid') {
        const { from, to } = node
        const active = sel.from <= to && sel.to >= from
        const wholeLines = state.doc.lineAt(from).from === from && state.doc.lineAt(to).to === to
        if (!active && wholeLines) {
          const textNode = node.getChild('CodeText')
          const code = textNode ? state.sliceDoc(textNode.from, textNode.to) : ''
          builder.add(from, to, Decoration.replace({ widget: new MermaidWidget(code), block: true }))
        }
      }
      return false
    },
  })
  return builder.finish()
}

const mermaidPreviewField = StateField.define({
  create: buildMermaidDecorations,
  update(decorations, tr) {
    return tr.docChanged || tr.selection ? buildMermaidDecorations(tr.state) : decorations
  },
  provide: (field) => EditorView.decorations.from(field),
})

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

        if (name === 'Image') {
          // 커서가 있는 줄은 원문(![..](..))을 그대로 보여주고, 벗어나면 이미지로 바꾼다.
          if (!lineOverlaps(state, node.from, sel)) {
            const marks = node.getChildren('LinkMark')
            const urlNode = node.getChild('URL')
            const alt = marks.length >= 2 ? state.doc.sliceString(marks[0].to, marks[1].from) : ''
            const src = urlNode ? state.doc.sliceString(urlNode.from, urlNode.to) : ''
            if (src) {
              items.push({
                from: node.from,
                to: node.to,
                deco: Decoration.replace({ widget: new ImageWidget(src, alt) }),
              })
              return false
            }
          }
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

function isImageFile(file) {
  return file.type.startsWith('image/')
}

// onUploadImage(file) => Promise<{ url }> 를 주면 이미지 붙여넣기 / 끌어놓기 / "이미지 첨부" 버튼이 켜진다.
// 업로드하는 동안에는 자리표시(![이름](uploading:..))를 먼저 넣고, 끝나면 실제 주소로 바꾼다 —
// 그래서 업로드 중에 다른 곳을 계속 편집해도 위치가 어긋나지 않는다.
function MarkdownLiveEditor({ initialValue, onChange, placeholder: placeholderText, onUploadImage, onUploadError }) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const uploadRef = useRef(onUploadImage)
  uploadRef.current = onUploadImage
  const uploadErrorRef = useRef(onUploadError)
  uploadErrorRef.current = onUploadError

  function replaceText(view, text, replacement) {
    if (viewRef.current !== view) return // 업로드 중에 에디터가 닫힌 경우
    const index = view.state.doc.toString().indexOf(text)
    if (index >= 0) view.dispatch({ changes: { from: index, to: index + text.length, insert: replacement } })
  }

  async function uploadAndInsert(view, files, pos) {
    let at = pos
    for (const file of files.filter(isImageFile)) {
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '') || 'image'
      const token = `${UPLOADING_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const placeholderMd = `![${alt}](${token})`

      // 이미지는 한 줄을 통째로 차지하게 넣는다.
      const insertAt = Math.min(at ?? view.state.selection.main.head, view.state.doc.length)
      const line = view.state.doc.lineAt(insertAt)
      const insert = `${insertAt > line.from ? '\n' : ''}${placeholderMd}\n`
      view.dispatch({ changes: { from: insertAt, insert }, selection: { anchor: insertAt + insert.length } })
      at = insertAt + insert.length

      try {
        const { url } = await uploadRef.current(file)
        replaceText(view, placeholderMd, `![${alt}](${url})`)
      } catch (err) {
        replaceText(view, `${placeholderMd}\n`, '')
        replaceText(view, placeholderMd, '')
        uploadErrorRef.current?.(err.message || '이미지를 올리지 못했습니다.')
      }
    }
  }

  // 숨겨진 <input>을 DOM에 붙이지 않고 만든다 — 에디터가 폼의 <label> 안에 있어도
  // 라벨 클릭이 파일 선택창을 여는 일이 없게 하기 위해서다.
  function openFilePicker() {
    const view = viewRef.current
    if (!view) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/gif,image/webp'
    input.multiple = true
    input.onchange = () => {
      const files = [...(input.files || [])]
      if (files.length > 0) uploadAndInsert(view, files)
    }
    input.click()
  }

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
        mermaidPreviewField,
        placeholderExt(placeholderText || ''),
        EditorView.domEventHandlers({
          paste(event, view) {
            if (!uploadRef.current) return false
            const files = [...(event.clipboardData?.files || [])].filter(isImageFile)
            if (files.length === 0) return false
            event.preventDefault()
            uploadAndInsert(view, files)
            return true
          },
          drop(event, view) {
            if (!uploadRef.current) return false
            const files = [...(event.dataTransfer?.files || [])].filter(isImageFile)
            if (files.length === 0) return false
            event.preventDefault()
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
            uploadAndInsert(view, files, pos ?? undefined)
            return true
          },
        }),
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

  return (
    <div className="mle-wrap">
      {onUploadImage && (
        <div className="mle-toolbar">
          <button type="button" className="btn-secondary" onClick={openFilePicker}>
            이미지 첨부
          </button>
          <span className="mle-toolbar-hint">붙여넣기(⌘/Ctrl+V)나 끌어놓기로도 넣을 수 있어요</span>
        </div>
      )}
      <div className="mle mle-cm" ref={containerRef} />
    </div>
  )
}

export default MarkdownLiveEditor
