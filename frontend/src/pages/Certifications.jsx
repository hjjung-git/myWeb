import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import SectionHead from '../components/SectionHead.jsx'
import SectionPage from '../components/SectionPage.jsx'

const OVERVIEW_COUNT = 4

// "어학 / 자격증" — 홈에서는 몇 개만(Overview), /certifications 에서는 전체. /api/certifications에서 받아온다.
// 카드를 클릭하면 각 자격증 상세 페이지(합격확인증 PDF, 합격일자)로 이동한다.
function Certifications({ full = false }) {
  const { isAdmin } = useAuth()
  const [certs, setCerts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiGet('/api/certifications')
      .then(setCerts)
      .catch((err) => setError(err.message))
  }, [])

  const shown = full ? certs : certs?.slice(0, OVERVIEW_COUNT)

  const body = (
    <>
      {isAdmin && (
        <div className="list-toolbar">
          <Link to="/certifications/new" className="btn-primary">
            + 어학 / 자격증 추가
          </Link>
        </div>
      )}

      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && certs === null && <p className="status">불러오는 중...</p>}
      {!error && certs?.length === 0 && <p className="status">아직 등록된 어학/자격증이 없습니다.</p>}

      {!error && shown?.length > 0 && (
        <div className="cert-row">
          {shown.map((cert) => (
            <Link key={cert.id} to={`/certifications/${cert.id}`} className="cert-card">
              <div className="mark">{cert.mark}</div>
              <div>
                <div className="cert-name">{cert.name}</div>
                <div className="cert-issuer">{cert.issuer}</div>
                {cert.planned && <div className="cert-planned">취득 예정</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )

  if (full) {
    return (
      <SectionPage id="certifications" eyebrow="Language & Certifications" title="어학 / 자격증">
        {body}
      </SectionPage>
    )
  }
  return (
    <section id="certifications" className="portfolio-section">
      <SectionHead eyebrow="Language & Certifications" title="어학 / 자격증" to="/certifications" />
      {body}
    </section>
  )
}

export default Certifications
