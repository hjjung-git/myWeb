import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

// 홈 화면의 "교육" 섹션 — 수료한 교육을 /api/educations에서 받아와 타임라인(기간 + 교육명 + 기관)으로 보여준다.
// 항목을 클릭하면 상세 페이지(배운 내용, 프로젝트 링크, 수료증 PDF)로 이동한다.
function Educations() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiGet('/api/educations')
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section id="educations" className="portfolio-section">
      <p className="eyebrow">Education</p>
      <h2 className="section-title">교육</h2>

      {isAdmin && (
        <div className="list-toolbar">
          <Link to="/educations/new" className="btn-primary">
            + 교육 추가
          </Link>
        </div>
      )}

      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && items === null && <p className="status">불러오는 중...</p>}
      {!error && items?.length === 0 && <p className="status">아직 등록된 교육이 없습니다.</p>}

      {!error && items?.length > 0 && (
        <div className="timeline">
          {items.map((item) => (
            <div key={item.id} className="tl-item">
              <Link to={`/educations/${item.id}`}>
                <div className="tl-date">{item.periodText || ' '}</div>
                <div className="tl-body">
                  <h3>{item.name}</h3>
                  {item.institution && <p className="portfolio-period">{item.institution}</p>}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Educations
