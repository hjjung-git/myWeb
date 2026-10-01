// 포트폴리오 초기 데이터를 한 번에 넣어주는 1회성 스크립트.
// 예전에 만들어뒀던 정적 포트폴리오 페이지의 실제 내용을 그대로 옮겨왔다 (가짜 더미 데이터 아님).
//
// 사용법:
//   1. 로컬 백엔드를 8081 포트로 먼저 켠다 (이미 켜져 있다면 생략)
//   2. cd frontend
//   3. node scripts/seed-portfolio.mjs
//
// 이미 등록된 항목이 있는 상태에서 다시 실행하면 중복으로 추가되니 주의.

const BASE = 'http://localhost:8081'
const ADMIN_CODE = 'admin1019' // AdminAccountInitializer에 설정된 기본 관리자 코드

let cookie = ''

function captureCookie(res) {
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
}

async function getCsrf() {
  const res = await fetch(`${BASE}/api/auth/csrf`, {
    headers: cookie ? { Cookie: cookie } : {},
  })
  captureCookie(res)
  return res.json()
}

async function loginAsAdmin() {
  const csrf = await getCsrf()
  const res = await fetch(`${BASE}/api/auth/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      [csrf.headerName]: csrf.token,
    },
    body: JSON.stringify({ code: ADMIN_CODE }),
  })
  captureCookie(res)
  if (!res.ok) throw new Error(`관리자 로그인 실패 (${res.status}) — 백엔드가 켜져 있는지, 포트가 8081인지 확인`)
  console.log('관리자 모드 전환 성공')
}

async function createItem(item) {
  const csrf = await getCsrf()
  const res = await fetch(`${BASE}/api/portfolio-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      [csrf.headerName]: csrf.token,
    },
    body: JSON.stringify(item),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`항목 생성 실패 (${res.status}): ${item.title} — ${text}`)
  }
  const created = await res.json()
  console.log(`등록됨: [${created.id}] ${created.title}`)
}

const items = [
  {
    type: 'EXPERIENCE',
    title: 'AWS RDS MySQL 프로덕션 운영',
    summary: '인스턴스 배포·보안 설정·백업/복구 구성, CI/CD 파이프라인 구축 등 RDS 운영 실무 경험.',
    detailContent:
      '인스턴스 배포 및 보안 설정, 백업/복구 구성을 직접 다뤘다. CI/CD 파이프라인을 구축해 배포를 자동화했고, RDS 마이너 버전 자동 업그레이드 알림을 검토하며 프로덕션 환경에서 자동 적용과 수동 제어를 가르는 판단 기준을 세웠다.',
    periodText: 'RDS / MySQL',
    techStack: 'AWS RDS, MySQL, CI/CD',
    displayOrder: 1,
  },
  {
    type: 'PROJECT',
    title: '포트폴리오 웹 서버 구축',
    summary:
      '기존 운영 서버를 Strangler Fig 방식으로 점진 전환 — Flyway, REST API, React SPA, 자체 호스팅까지 아우르는 브라운필드 마이그레이션.',
    detailContent:
      '기존 Thymeleaf 기반 서버를 폐기하지 않고 위에서 점진적으로 구조를 교체하는 브라운필드 마이그레이션 프로젝트다. Flyway로 스키마 버전 관리를 도입하고, 기존 SSR 컨트롤러 옆에 REST API 레이어(Strangler Fig)를 추가했으며, 로그인/회원가입 대신 관리자 코드 기반 전환 방식을 설계했다. 프론트엔드는 React(Vite)로 분리했고, 이후 자체 소유 하드웨어 + Cloudflare Tunnel로 셀프 호스팅할 예정이다.',
    periodText: '2026.09 - 진행중',
    techStack: 'Spring Boot, Spring Security, Flyway, MySQL, React, Vite',
    linkUrl: 'https://github.com/hjjung-git/myWeb',
    displayOrder: 1,
  },
  {
    type: 'PROJECT',
    title: '온톨로지 기반 지식그래프 구축',
    summary:
      '예산 집행 도메인을 대상으로 역량질문 → 클래스/계층 설계 → 카디널리티 정의 → 검증으로 이어지는 온톨로지 설계 방법론을 Neo4j로 구현.',
    detailContent:
      'Cypher 입문부터 고급까지(CRUD, 필터링, WITH 집계, N-hop/OPTIONAL MATCH, 가변 길이 경로, shortestPath, MERGE, EXISTS{} 부정 패턴, 제약조건/인덱스, PROFILE 쿼리 플랜 분석, 트랜잭션 배치, LOAD CSV) 전 과정을 다뤘다. 비정형 데이터 정제 파이프라인(중복 노드 병합, 문자열 정규화, 끊어진 FK 격리, NULL 심각도 분류, apoc.refactor.mergeNodes)도 함께 구축했다. 이후 HybridRAG로의 확장을 구상 중이다.',
    periodText: '2026 - 진행중',
    techStack: 'Neo4j, Cypher, APOC, Python',
    displayOrder: 2,
  },
  {
    type: 'PROJECT',
    title: '생성형 챗봇 개발',
    summary: '온톨로지·그래프DB 프로젝트와 연계한 생성형 챗봇 개발 구상 — 아직 시작 전, 진행되는 대로 업데이트 예정.',
    detailContent: '',
    periodText: '예정',
    displayOrder: 3,
  },
]

async function main() {
  await loginAsAdmin()
  for (const item of items) {
    await createItem(item)
  }
  console.log('완료')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
