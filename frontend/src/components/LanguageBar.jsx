import { useEffect, useState } from 'react'
import { fetchLanguages } from '../lib/github.js'

// GitHub "Languages"처럼 구성된 소스의 비율 — 가로 막대 + (선택) 범례.
// url: 프로젝트의 GitHub 링크. 저장소가 아니거나 불러오지 못하면 아무것도 그리지 않는다.
function LanguageBar({ url, legend = 3 }) {
  const [langs, setLangs] = useState(null)
  useEffect(() => {
    let alive = true
    fetchLanguages(url).then((data) => alive && setLangs(data))
    return () => { alive = false }
  }, [url])
  if (!langs) return null
  const shown = langs.slice(0, legend)
  return (
    <div className="lang-bar" role="img" aria-label={`언어 비율: ${langs.slice(0, 5).map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', ')}`}>
      <div className="lang-track">
        {langs.map((l) => (
          <span key={l.name} style={{ width: `${l.pct}%`, background: l.color }} title={`${l.name} ${l.pct.toFixed(1)}%`} />
        ))}
      </div>
      {legend > 0 && (
        <ul className="lang-legend">
          {shown.map((l) => (
            <li key={l.name}>
              <i style={{ background: l.color }} />
              {l.name} <em>{l.pct.toFixed(1)}%</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LanguageBar
