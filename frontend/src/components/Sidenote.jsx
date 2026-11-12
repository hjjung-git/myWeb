import { useState } from 'react'
import './sidenote.css'

// 우측 여백 메모 한 개 — remarkSidenotes가 만든 <sidenote data-n="번호">…</sidenote>를 그린다.
// 넓은 화면: 번호는 위첨자로만 보이고, 메모는 CSS가 본문 오른쪽 여백에 띄운다.
// 좁은 화면: 여백이 없으므로 번호를 누르면 그 자리에서 펼쳐진다.
function Sidenote({ node, children, ...props }) {
  const [open, setOpen] = useState(false)
  const n = props['data-n']
  return (
    <>
      <button
        type="button"
        className="sn-mark"
        aria-expanded={open}
        aria-label={`용어 메모 ${n}`}
        onClick={() => setOpen((v) => !v)}
      >
        {n}
      </button>
      <span className={open ? 'sidenote is-open' : 'sidenote'}>
        <span className="sn-num">{n}</span>
        {children}
      </span>
    </>
  )
}

export default Sidenote
