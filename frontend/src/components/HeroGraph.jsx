// 메인 화면의 그림 — 관계형 DB에서 그래프 DB·온톨로지·LLM으로 뻗어 나가며 "연결된 데이터"를 다루는 모습.
// 장식용이라 스크린리더에서는 숨긴다. 색은 CSS 변수라서 라이트/다크를 따라가고, 움직임은 모션 줄이기 설정을 따른다.
const C = [260, 260]
const RING = [
  { label: 'RDBMS', x: 260, y: 92 },
  { label: 'Graph DB', x: 405, y: 176 },
  { label: 'Ontology', x: 405, y: 344 },
  { label: 'LLM', x: 260, y: 428 },
  { label: 'Backend', x: 115, y: 344 },
  { label: 'Archive', x: 115, y: 176 },
]
// 바깥 위성 노드 (ring 번호, 좌표)
const SATS = [
  [0, 260, 24], [0, 330, 40], [1, 478, 120], [1, 492, 214], [2, 492, 306], [2, 478, 400],
  [3, 190, 488], [3, 330, 488], [4, 42, 400], [5, 28, 214], [5, 42, 120], [0, 190, 40],
]
const CROSS = [[0, 2], [1, 5], [3, 1], [4, 0]]

function HeroGraph() {
  return (
    <svg className="hero-graph" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
      <g className="hg-edges">
        {SATS.map(([i, x, y], k) => (
          <line key={`s${k}`} className="hg-edge hg-edge-faint" x1={RING[i].x} y1={RING[i].y} x2={x} y2={y} />
        ))}
        {RING.map((n, i) => {
          const m = RING[(i + 1) % RING.length]
          return <line key={`r${i}`} className="hg-edge" x1={n.x} y1={n.y} x2={m.x} y2={m.y} />
        })}
        {CROSS.map(([a, b], k) => (
          <line key={`c${k}`} className="hg-edge hg-flow" x1={RING[a].x} y1={RING[a].y} x2={RING[b].x} y2={RING[b].y} style={{ animationDelay: `${k * -1.3}s` }} />
        ))}
        {RING.map((n, i) => (
          <line key={`h${i}`} className="hg-edge hg-spoke" x1={C[0]} y1={C[1]} x2={n.x} y2={n.y} />
        ))}
      </g>
      <g className="hg-sats">
        {SATS.map(([, x, y], k) => (
          <circle key={k} className="hg-sat" cx={x} cy={y} r="4.5" style={{ animationDelay: `${k * -0.7}s` }} />
        ))}
      </g>
      <g className="hg-ring">
        {RING.map((n, i) => (
          <g key={n.label} className="hg-node" style={{ animationDelay: `${i * -1.1}s` }}>
            <circle cx={n.x} cy={n.y} r="31" />
            <text x={n.x} y={n.y + 4} textAnchor="middle">{n.label}</text>
          </g>
        ))}
      </g>
      <g className="hg-core">
        <circle className="hg-core-halo" cx={C[0]} cy={C[1]} r="58" />
        <circle cx={C[0]} cy={C[1]} r="42" />
        <text x={C[0]} y={C[1] + 6} textAnchor="middle">FDE</text>
      </g>
    </svg>
  )
}

export default HeroGraph
