import { useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { SidenoteContext } from './SidenoteLayout.jsx'
import './sidenote.css'

// 우측 여백 메모 한 개 — remarkSidenotes가 만든 <sidenote data-n="번호">…</sidenote>를 그린다.
// 본문에는 번호(위첨자)만 남기고, 넓은 화면에서는 메모 내용을 SidenoteLayout의 오른쪽 칸으로 옮겨 그린다.
// 좁은 화면에서는 번호를 누르면 그 자리에서 펼쳐진다.
function Sidenote({ node, children, ...props }) {
  const [open, setOpen] = useState(false)
  const ctx = useContext(SidenoteContext)
  const n = props['data-n']

  const note = (
    <span className={open ? 'sidenote is-open' : 'sidenote'} data-n={n}>
      <span className="sn-num">{n}</span>
      {children}
    </span>
  )

  return (
    <>
      <button
        type="button"
        className="sn-mark"
        data-n={n}
        aria-expanded={open}
        aria-label={`용어 메모 ${n}`}
        onClick={() => setOpen((v) => !v)}
      >
        {n}
      </button>
      {ctx?.wide && ctx.asideEl ? createPortal(note, ctx.asideEl) : note}
    </>
  )
}

export default Sidenote
