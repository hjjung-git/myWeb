import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import SectionHead from '../components/SectionHead.jsx'
import SectionPage from '../components/SectionPage.jsx'

const OVERVIEW_COUNT = 3

// "교육" — 홈에서는 최근 몇 개(Overview), /educations 에서는 전체. 수료한 교육을 /api/educations에서 받아와
// 타임라인(기간 + 교육명 + 기관)으로 보여준다. 항목을 클릭하면 상세 페이지(배운 내용, 프로젝트 링크, 수료증 PDF)로 이동한다.
function Educations({ full = false }) {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiGet('/api/educations')
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [])

  const shown = full ? items : items?.slice(0, OVERVIEW_COUNT)

  const body = (
    <>
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

      {!error && shown?.length > 0 && (
        <div className="timeline">
          {shown.map((item) => (
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
    </>
  )

  if (full) {
    return (
      <SectionPage id="educations" eyebrow="Education" title="교육">
        {body}
      </SectionPage>
    )
  }
  return (
    <section id="educations" className="portfolio-section">
      <SectionHead eyebrow="Education" title="교육" to="/educations" />
      {body}
    </section>
  )
}

export default Educations
