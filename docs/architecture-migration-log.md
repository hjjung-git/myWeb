# 아키텍처 마이그레이션 — 진행 기록 (포트폴리오 통합 · API 현대화)

`README.md`는 포트폴리오용 요약만 담고, 이 문서는 진행 중인 작업의 **결정 이유와 핵심 개념**만 간단히 기록한다. 실제 구현은 AI 도구의 도움을 받아 진행하므로 코드/명령어는 여기 옮기지 않는다.

<br>

---

## 핵심 개념

- **브라운필드(Brownfield) 마이그레이션**: 기존 서버를 폐기하고 새로 만드는 대신(그린필드), 운영 중인 서버 위에서 구조를 점진적으로 교체하는 방식. 서비스 중단 없이 구조를 바꿔야 하는 실무 상황에 가까운 경험을 위해 선택.
- **Strangler Fig 패턴**: 기존 Controller 전체를 한 번에 REST API로 바꾸지 않고, 기능 단위로 하나씩 신규 구조로 교체해 나가는 전략. 교체가 끝난 영역과 레거시 영역이 한동안 공존하며, 이 문서의 Tech Stack "레거시/신규" 구분이 그 상태를 나타낸다.
- **Headless / API-First 백엔드**: Controller가 View(HTML)를 직접 반환하던 구조에서, 데이터(JSON)만 반환하는 구조로 전환. 백엔드가 특정 화면 기술에 묶이지 않아 프론트엔드를 자유롭게 교체·확장할 수 있게 됨.
- **SSR → SPA 전환**: Thymeleaf 기반 서버사이드 렌더링(SSR)에서 React 기반 클라이언트사이드 렌더링(SPA)으로 전환. 프론트/백엔드 분리(Headless API-First)가 선행되어야 가능한 후속 작업.

<br>

---

## 목표

- 포트폴리오 웹사이트를 별도 사이트가 아닌 이 서버의 신규 도메인으로 통합
- 프론트엔드 / 백엔드 분리 (React SPA + REST API), Strangler Fig 방식으로 기존 Controller를 점진 전환
- DB 운영 경험 다각화: 관리형 AWS RDS → 자체 구축 MySQL

<br>

---

## 결정 & 이유

| 영역 | 기존 | 변경 후 | 이유 |
| :--- | :--- | :--- | :--- |
| Frontend | Thymeleaf (SSR) | React (SPA) | 동적 UI 자유도 확보 |
| Backend | View 반환 Controller | REST API | 프론트/백엔드 분리 |
| DB | AWS RDS MySQL | 자체 구축 MySQL | 관리형 서비스가 대신 해주던 설치·계정·권한 관리를 직접 경험 |
| 배포 (예정) | AWS EC2 + Nginx | 자체 하드웨어 + Cloudflare Tunnel | 관리형 서비스 없이 인프라를 직접 소유·운영해보는 경험 |

기존에 계획했던 "투자/매매일지" 확장(서비스 확장 단계의 후속)은 보류하고, 온톨로지·생성형 챗봇 프로젝트와 연계되는 시점에 재개 예정. 배포 전환은 개발이 끝난 뒤 마지막 단계에서 진행하며 현재 개발을 막지 않는다.

기존 로컬 개발 DB는 이미 Hibernate `ddl-auto=update`로 만들어져 있어, 스키마를 처음부터 다시 만들지 않고 Flyway의 baseline 기능으로 현재 상태를 버전 1로 그대로 인정한 뒤 이후 변경분부터 마이그레이션 스크립트로 관리하기로 함. 이에 맞춰 `ddl-auto`는 `validate`로 전환해, Hibernate가 스키마를 직접 바꾸는 대신 엔티티와 실제 스키마가 일치하는지만 검증하도록 함.

<br>

---

## 진행 상황

- [x] 로컬 개발 DB를 H2 → 자체 구축 MySQL(LTS)로 전환, 전용 DB/계정 구성
- [x] 로컬 자격 증명 파일 git 추적 제외 (보안)
- [x] Flyway 도입 — 베이스라인 마이그레이션(`V1__baseline.sql`)으로 로컬 DB 스키마 생성, `ddl-auto=validate`로 전환해 로컬 실행 검증까지 완료
- [ ] Controller REST API 전환 착수 — 게시글(Post) 도메인부터 시작. 기존 PostController(SSR)는 그대로 두고 `/api/posts` 조회(GET) 엔드포인트를 DTO 기반으로 새로 추가 (Strangler Fig: 신규 API가 기존 SSR 라우트를 대체하는 게 아니라 병행). 로컬 실행 + JSON 응답 확인까지 완료. 작성/수정/삭제 API는 세션 인증을 JSON API에서 어떻게 다룰지(CSRF 등) 정한 뒤 추가 예정

## 다음 단계

- [ ] Controller REST API 전환 계속 — 나머지 도메인(User/Article/Portfolio) 조회 API 추가, 이후 쓰기 API용 인증 방식 결정 및 적용
- [ ] React 프론트엔드 구축, 포트폴리오 콘텐츠 통합
- [ ] (개발 완료 후) 자체 하드웨어 상시 구동 + Cloudflare Tunnel 배포
