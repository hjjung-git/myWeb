const CERTS = [
  { mark: 'SQL', name: 'SQLD', issuer: 'SQL 개발자' },
  { mark: 'IT', name: '정보처리기사', issuer: 'Engineer Information Processing' },
  { mark: 'LX', name: '리눅스마스터 2급', issuer: 'Linux Master Level 2' },
  { mark: 'KH', name: '한국사능력검정 심화 1급', issuer: 'Korean History Proficiency Test' },
]

function Certifications() {
  return (
    <section id="certifications" className="portfolio-section">
      <p className="eyebrow">Certifications</p>
      <h2 className="section-title">자격증</h2>
      <div className="cert-row">
        {CERTS.map((cert) => (
          <div key={cert.name} className="cert-card">
            <div className="mark">{cert.mark}</div>
            <div>
              <div className="cert-name">{cert.name}</div>
              <div className="cert-issuer">{cert.issuer}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Certifications
