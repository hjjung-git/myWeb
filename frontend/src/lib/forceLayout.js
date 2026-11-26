// 간단한 힘 기반 배치(외부 라이브러리 없이) — 노드끼리는 밀고, 이어진 노드끼리는 당기고, 가운데로 살짝 모은다.
// 관리자 모니터링용 그래프(노드 수백 개 이하)라 O(n²) 반복으로 충분하다. 같은 입력이면 같은 결과(난수 없음).
export function forceLayout(nodes, links, { iterations = 300, size = 1000 } = {}) {
  const n = nodes.length
  const index = new Map(nodes.map((node, i) => [node.id, i]))
  const pos = nodes.map((_, i) => {
    const a = (2 * Math.PI * i) / Math.max(n, 1)
    const r = size * 0.35 * (0.6 + 0.4 * ((i * 7919) % 97) / 97)
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  })
  const edges = links
    .map((l) => [index.get(l.source), index.get(l.target)])
    .filter(([a, b]) => a !== undefined && b !== undefined && a !== b)
  const k = Math.sqrt((size * size) / Math.max(n, 1)) * 0.55 // 이상적인 간격
  let temp = size / 8

  for (let it = 0; it < iterations; it++) {
    const disp = pos.map(() => ({ x: 0, y: 0 }))
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x
        let dy = pos[i].y - pos[j].y
        let d2 = dx * dx + dy * dy
        if (d2 < 0.01) {
          dx = 0.1 * ((i % 3) - 1 || 1)
          dy = 0.1
          d2 = 0.02
        }
        const f = (k * k) / d2
        disp[i].x += dx * f
        disp[i].y += dy * f
        disp[j].x -= dx * f
        disp[j].y -= dy * f
      }
    }
    for (const [a, b] of edges) {
      const dx = pos[a].x - pos[b].x
      const dy = pos[a].y - pos[b].y
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01
      const f = d / k
      disp[a].x -= dx * f
      disp[a].y -= dy * f
      disp[b].x += dx * f
      disp[b].y += dy * f
    }
    for (let i = 0; i < n; i++) {
      disp[i].x -= pos[i].x * 0.02 // 가운데로
      disp[i].y -= pos[i].y * 0.02
      const len = Math.sqrt(disp[i].x ** 2 + disp[i].y ** 2) || 1
      const step = Math.min(len, temp)
      pos[i].x += (disp[i].x / len) * step
      pos[i].y += (disp[i].y / len) * step
    }
    temp = Math.max(temp * 0.985, 1)
  }
  return new Map(nodes.map((node, i) => [node.id, pos[i]]))
}
