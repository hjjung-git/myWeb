import { useState } from 'react'
import { apiMutate } from '../lib/api.js'

// 관리자 전용 — 기술별 "내 숙련도"(눈금)와 홈의 핵심 기술 여부를 정한다. 채움(기록 기반)은 자동이라 여기서 못 바꾼다.
function SkillLevelEditor({ groups, rows, onSaved }) {
  const byName = new Map(rows.map((r) => [r.name, r]))
  const [draft, setDraft] = useState(() => new Map(rows.map((r) => [r.name, { level: r.self, featured: r.featured }])))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const set = (name, patch) => setDraft((prev) => new Map(prev).set(name, { ...prev.get(name), ...patch }))

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const body = [...draft.entries()].map(([name, v]) => ({ name, level: Number(v.level) || 0, featured: v.featured }))
      const saved = await apiMutate('/api/skill-levels', 'PUT', body)
      onSaved(saved)
      setMessage('저장했습니다.')
    } catch (err) {
      setMessage(`저장 실패: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const seen = new Set()
  return (
    <details className="skill-editor">
      <summary>숙련도 · 핵심 기술 편집 (관리자)</summary>
      <p className="status">눈금 값(내 숙련도)과 "핵심"(홈에 막대로 보일 기술)을 정합니다. 핵심을 하나도 안 고르면 기록이 많은 기술이 자동으로 보여요.</p>
      {groups.map((g) => (
        <div key={g.name} className="se-group">
          <h4>{g.name}</h4>
          {g.tags.filter((t) => !seen.has(t) && seen.add(t)).map((name) => {
            const d = draft.get(name)
            return (
              <div key={name} className="se-row">
                <label className="se-featured" title="홈의 핵심 기술로 표시">
                  <input type="checkbox" checked={d.featured} onChange={(e) => set(name, { featured: e.target.checked })} /> 핵심
                </label>
                <span className="se-name">{name}</span>
                <input type="range" min="0" max="100" step="5" value={d.level} onChange={(e) => set(name, { level: e.target.value })} aria-label={`${name} 내 숙련도`} />
                <output>{d.level}</output>
                <span className="se-evidence">기록 {byName.get(name)?.evidence ?? 0}%</span>
              </div>
            )
          })}
        </div>
      ))}
      <div className="se-actions">
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>저장</button>
        {message && <span className="status">{message}</span>}
      </div>
    </details>
  )
}

export default SkillLevelEditor
