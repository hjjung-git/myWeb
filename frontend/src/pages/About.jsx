// 소개(About) 섹션 — 홈(한 페이지 스크롤)의 첫 섹션.
function About() {
  return (
    <>
      <section id="about" className="hero">
        <p className="hero-role">DATABASE &amp; BACKEND ENGINEER</p>
        <h1>정현진</h1>
        <p className="tagline">
          RDBMS 운영 경험을 바탕으로 그래프 데이터베이스·온톨로지 설계까지 확장하고 있는 백엔드 엔지니어입니다.
          AWS RDS MySQL 실무 경험과 SQLD·정보처리기사 자격을 기반으로, 데이터가 쌓이고 연결되는 구조를 설계하고
          운영하는 일을 지향합니다.
        </p>
        <div className="chip-row">
          <span className="chip">금오공과대학교 · 컴퓨터공학</span>
          <span className="chip">2027.02 졸업예정</span>
          <span className="chip">SQLD</span>
          <span className="chip">정보처리기사</span>
        </div>
      </section>

      <section className="portfolio-section">
        <p className="eyebrow">About</p>
        <h2 className="section-title">소개</h2>
        <p className="lede">
          금오공과대학교에서 컴퓨터공학을 전공하며 2027년 2월 졸업을 앞두고 있습니다. AWS RDS MySQL 환경에서
          배포, 보안 설정, 백업/복구, CI/CD 파이프라인 구성까지 데이터베이스 운영의 실제 흐름을 다뤄본 경험이
          있습니다. 최근에는 관계형 데이터베이스 위에서 쌓은 기반을 Neo4j와 온톨로지 기반 지식그래프로 확장하며,
          정형 데이터와 연결 구조를 함께 다루는 엔지니어로 성장하고 있습니다.
        </p>
      </section>
    </>
  )
}

export default About
