import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

// 홈 화면의 "Certifications" 섹션 — 이제 하드코딩이 아니라 /api/certifications에서 받아온다.
// 카드를 클릭하면 각 자격증 상세 페이지(합격확인증 PDF, 합격일자)로 이동한다.
function Certifications() {
  const { isAdmin } = useAuth()
  const [certs, setCerts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiGet('/api/certifications')
      .then(setCerts)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section id="certifications" className="portfolio-section">
      <p className="eyebrow">Certifications</p>
      <h2 className="section-title">자격증</h2>

      {isAdmin && (
        <div className="list-toolbar">
          <Link to="/certifications/new" className="btn-primary">
            + 자격증 추가
          </Link>
        </div>
      )}

      {error && <p className="status status-error">목록을 불러오지 못했습니다. ({error})</p>}
      {!error && certs === null && <p className="status">불러오는 중...</p>}
      {!error && certs?.length === 0 && <p className="status">아직 등록된 자격증이 없습니다.</p>}

      {!error && certs?.length > 0 && (
        <div className="cert-row">
          {certs.map((cert) => (
            <Link key={cert.id} to={`/certifications/${cert.id}`} className="cert-card">
              <div className="mark">{cert.mark}</div>
              <div>
                <div className="cert-name">{cert.name}</div>
                <div className="cert-issuer">{cert.issuer}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default Certifications
