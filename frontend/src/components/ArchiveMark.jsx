// Archive를 대표하는 벡터 그림 — 대분류 › 중분류 › 소분류 › 글로 가지를 뻗는 지식 트리.
// 색은 전부 CSS 변수라서 라이트/다크 테마를 따라간다. (스타일은 App.css의 .archive-mark)
const W = 360
const H = 220
const ROOT = [180, 200]

// 단계별 노드 좌표를 미리 계산해 둔다 (부모 → 자식 간선 포함).
const level1 = [70, 180, 290].map((x) => ({ x, y: 142 }))
const level2 = level1.flatMap((p, i) =>
  [-36, 36].map((dx, j) => ({ x: p.x + dx, y: 86 - ((i + j) % 2) * 6, parent: p })),
)
const level3 = level2.flatMap((p, i) =>
  [-13, 13].map((dx, j) => ({ x: p.x + dx, y: 36 + ((i * 2 + j) % 3) * 7, parent: p, lit: (i * 2 + j) % 5 === 0 })),
)

// 부모에서 자식으로 부드럽게 휘어지는 곡선
const edge = ([px, py], { x, y }) => {
  const my = (py + y) / 2
  return `M${px} ${py} C${px} ${my} ${x} ${my} ${x} ${y}`
}

function ArchiveMark() {
  return (
    <svg className="archive-mark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Archive — 분류별로 가지를 뻗는 지식 트리">
      <ellipse className="mark-ground" cx={ROOT[0]} cy={ROOT[1] + 12} rx="120" ry="6" />
      <g className="mark-edges">
        {level1.map((n, i) => <path key={`a${i}`} d={edge(ROOT, n)} />)}
        {level2.map((n, i) => <path key={`b${i}`} d={edge([n.parent.x, n.parent.y], n)} />)}
        {level3.map((n, i) => <path key={`c${i}`} d={edge([n.parent.x, n.parent.y], n)} />)}
      </g>
      <g className="mark-leaves">
        {level3.map((n, i) => <circle key={i} className={n.lit ? 'is-lit' : undefined} cx={n.x} cy={n.y} r="3.2" />)}
      </g>
      <g className="mark-l2">
        {level2.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r="5" />)}
      </g>
      <g className="mark-l1">
        {level1.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r="7.5" />)}
      </g>
      <circle className="mark-root" cx={ROOT[0]} cy={ROOT[1]} r="10" />
    </svg>
  )
}

export default ArchiveMark
