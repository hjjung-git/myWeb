// 소개(About) — 홈 맨 위의 메인 카드, 그리고 /about 전용 페이지(전체 소개).
import { Link } from 'react-router-dom'
import SectionPage from '../components/SectionPage.jsx'
import SectionHead from '../components/SectionHead.jsx'
import HeroGraph from '../components/HeroGraph.jsx'

// 카드와 전용 페이지가 같이 쓰는 핵심 사실
const FACTS = [
  { label: '학력', value: '금오공과대학교 컴퓨터공학 · 2027.02 졸업예정' },
  { label: '운영 경험', value: 'AWS RDS MySQL — 배포 · 보안 · 백업/복구 · CI/CD' },
  { label: '확장 중', value: 'Neo4j · 온톨로지 기반 지식그래프' },
  { label: '자격', value: 'SQLD · 정보처리기사 · 리눅스마스터 2급' },
]

function Facts() {
  return (
    <dl className="hero-facts">
      {FACTS.map((fact) => (
        <div key={fact.label} className="hero-fact">
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function About({ full = false }) {
  if (full) {
    return (
      <SectionPage id="about" eyebrow="About" title="소개">
        <Facts />
        <div className="about-text">
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
        </div>
        <div className="hero-cta">
          <Link to="/skills" className="btn-secondary">기술 스택과 경험 →</Link>
          <Link to="/portfolio" className="btn-secondary">프로젝트 →</Link>
          <Link to="/archive" className="btn-primary">Archive 둘러보기 →</Link>
        </div>
      </SectionPage>
    )
  }

  return (
    <div id="about">
      {/* 첫 화면 — 헤더를 뺀 화면 전체를 쓴다. 스크롤하면 아래에서 소개와 Overview가 이어진다. */}
      <section className="hero-screen">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-role">FORWARD DEPLOYED ENGINEER · DATA &amp; BACKEND</p>
            <h1>정현진</h1>
            <p className="tagline">
              낯선 도메인의 데이터를 빠르게 이해하고, 고객의 문제를 실제로 동작하는 시스템으로 연결하는
              Forward Deployed Engineer를 지향합니다.
            </p>
            <div className="hero-cta">
              <Link to="/archive" className="btn-primary">Archive 둘러보기 →</Link>
              <Link to="/portfolio" className="btn-secondary">프로젝트 보기</Link>
            </div>
          </div>
          <HeroGraph />
        </div>
        <a className="hero-scroll" href="#intro" aria-label="아래로 스크롤" onClick={(e) => {
          e.preventDefault()
          document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' })
        }}>
          <span>Scroll</span>
          <i aria-hidden="true" />
        </a>
      </section>

      <section id="intro" className="portfolio-section about-intro">
        <SectionHead eyebrow="About" title="소개" to="/about" linkLabel="소개 더 보기 →" />
        <Facts />
        <p className="lede">
          금오공과대학교에서 컴퓨터공학을 전공하며 2027년 2월 졸업을 앞두고 있습니다. AWS RDS MySQL 환경에서
          배포, 보안 설정, 백업/복구, CI/CD 파이프라인 구성까지 데이터베이스 운영의 실제 흐름을 다뤄본 경험이
          있고, 최근에는 그 기반을 Neo4j와 온톨로지 기반 지식그래프로 확장하고 있습니다.
        </p>
      </section>
    </div>
  )
}

export default About
