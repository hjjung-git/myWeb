import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiMutate } from '../lib/api.js'
import GraphMonitor from './GraphMonitor.jsx'

// 관리자 전용 — 지식 그래프(Neo4j) 상태와 '전체 다시 맞추기'. Archive 홈 맨 아래에 작게 둔다.
// 글·코드를 저장하면 서버가 그래프에 자동으로 반영하므로, 이 버튼은 처음 한 번이나 어긋났을 때만 쓴다.
const NODE_ORDER = ['Note', 'Code', 'Skill', 'Project', 'Category', 'Purpose']

function GraphAdminPanel() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [monitor, setMonitor] = useState(null) // 모니터링 창: 'graph' | 'chunks' | 'search'

  const load = useCallback(() => {
    apiGet('/api/graph/status')
      .then((s) => {
        setStatus(s)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function resync() {
    setBusy(true)
    setResult(null)
    try {
      const r = await apiMutate('/api/graph/resync', 'POST')
      setStatus(r)
      setResult(`다시 맞춤 — 글 ${r.synced?.notes ?? 0} · 코드 ${r.synced?.codes ?? 0} · 프로젝트 ${r.synced?.projects ?? 0} (${r.tookMs} ms)`)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const nodes = status?.nodes ?? {}
  const relTotal = Object.values(status?.relationships ?? {}).reduce((a, b) => a + Number(b), 0)
  const names = [...NODE_ORDER.filter((n) => n in nodes), ...Object.keys(nodes).filter((n) => !NODE_ORDER.includes(n))]

  return (
    <section className="graph-admin" aria-label="지식 그래프 관리">
      <p className="graph-admin-head">
        <span>지식 그래프</span>
        {status && <i className={`graph-dot${status.ok ? ' is-ok' : ''}`} aria-label={status.ok ? '연결됨' : '연결 안 됨'} />}
      </p>
      {status?.ok && status.chunks !== undefined && (
        <p className="graph-admin-counts">
          검색 조각 {status.chunks} · 임베딩 {status.embedded}
          {status.chunks !== status.embedded && <b className="graph-admin-warn"> ({status.chunks - status.embedded}개 비어 있음)</b>}
        </p>
      )}
      {status?.ok && (
        <p className="graph-admin-counts">
          {names.length === 0 ? '비어 있음' : names.map((n) => `${n} ${nodes[n]}`).join(' · ')}
          {names.length > 0 && ` · 관계 ${relTotal}`}
        </p>
      )}
      {status && !status.ok && <p className="graph-admin-error">{status.error}</p>}
      {error && <p className="graph-admin-error">{error}</p>}
      {result && <p className="graph-admin-counts">{result}</p>}
      <div className="graph-admin-actions">
        <button type="button" className="graph-admin-btn" onClick={() => setMonitor('graph')} disabled={!status?.ok}>
          그래프 보기
        </button>
        <button type="button" className="graph-admin-btn" onClick={() => setMonitor('chunks')} disabled={!status?.ok}>
          조각·검색 보기
        </button>
        <button type="button" className="graph-admin-btn" onClick={resync} disabled={busy || !status?.enabled}>
          {busy ? '맞추는 중...' : '전체 다시 맞추기'}
        </button>
      </div>
      {monitor && <GraphMonitor initialTab={monitor} admin onClose={() => setMonitor(null)} />}
    </section>
  )
}

export default GraphAdminPanel
