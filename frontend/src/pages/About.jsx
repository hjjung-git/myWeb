// 소개(About) 섹션 — 홈(한 페이지 스크롤)의 첫 섹션.
import { Link } from 'react-router-dom'

function About() {
  return (
    <>
      <section id="about" className="hero">
        <p className="hero-role">FORWARD DEPLOYED ENGINEER · DATA &amp; BACKEND</p>
        <h1>정현진</h1>
        <p className="tagline">
          낯선 도메인의 데이터를 빠르게 이해하고, 고객의 문제를 실제로 동작하는 시스템으로 연결하는
          Forward Deployed Engineer를 지향합니다. AWS RDS MySQL 운영 경험을 바탕으로 Neo4j·온톨로지
          기반 지식그래프, LLM 협업 도구까지 확장하며 데이터가 쌓이고 연결되는 구조를 설계합니다.
        </p>
        <div className="chip-row">
          <span className="chip">금오공과대학교 · 컴퓨터공학</span>
          <span className="chip">2027.02 졸업예정</span>
          <span className="chip">FDE 지향</span>
          <span className="chip">SQLD</span>
          <span className="chip">정보처리기사</span>
        </div>
        <div className="hero-cta">
          <a href="#portfolio" className="btn-secondary">프로젝트 보기</a>
          <Link to="/archive" className="btn-primary">Archive 둘러보기 →</Link>
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
        <p className="lede">
          커리어 방향은 Forward Deployed Engineer입니다. 사내 폐쇄망에서 처음 접하는 도메인의 민감한 내부
          데이터를 다루며 온톨로지를 설계했던 경험처럼, 현장의 낯선 업무와 제약을 빠르게 파악해 데이터
          모델과 구현으로 옮기는 일에 강점을 쌓고 있습니다. 같은 맥락에서 Claude API 기반 멀티세션 협업
          도구(RallyPoint)를 기획하며, 기존 프레임워크를 비교·검토해 필요한 곳에 직접 구현하는 판단력도
          기르고 있습니다.
        </p>
      </section>
    </>
  )
}

export default About
