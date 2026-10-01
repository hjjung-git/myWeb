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
- [ ] Controller REST API 전환 착수 — 게시글(Post) 도메인부터 시작. 기존 PostController(SSR)는 그대로 두고 `/api/posts` 조회(GET) 엔드포인트를 DTO 기반으로 새로 추가 (Strangler Fig: 신규 API가 기존 SSR 라우트를 대체하는 게 아니라 병행). 로컬 실행 + JSON 응답 확인까지 완료
- [ ] 관리자 모드 전환 API(`/api/auth/admin`) 추가 — 접근 모델을 "누구나 조회 가능 / admin만 로그인 후 수정 가능"으로 정하고, 별도 회원 로그인 화면 대신 코드 하나만 입력하면 관리자 모드로 전환되는 방식을 택함. 내부적으로는 기존 Spring Security 로그인 체계(고정 admin 계정)를 그대로 재사용해 새 인증 로직을 만들지 않음. CSRF는 그대로 켜둔 채 토큰 조회용 엔드포인트(`/api/auth/csrf`)를 추가해 대응. 기존 사이드바의 "설정" 오버레이에 코드 입력 UI도 같이 추가 (React 완성 전이라도 지금 화면에서 바로 쓸 수 있도록). 로컬 빌드 확인, 실제 코드 입력 동작은 검증 전
- [ ] 게시글 쓰기 API(작성/수정/삭제)는 위 관리자 모드 전환 확인 후 추가 예정
- [x] 기존 회원가입/폼 로그인 전면 제거 — 접근 모델이 "관리자 1명 + 조회는 누구나"로 확정되면서 일반 회원가입 기능 자체가 불필요해짐. UserController, 회원가입/로그인 화면, 폼 로그인 전용 성공·실패 핸들러를 모두 삭제하고, 기존에 그 핸들러들이 하던 로그인 시도 횟수 제한(IP당 5회/15분)은 관리자 코드 API 쪽으로 옮겨 재사용

- [x] 게시글 쓰기 API(작성/수정/삭제) 추가 — `/api/posts` POST/PUT/DELETE에 hasRole("ADMIN") 적용, 매매일지 필수값 검증은 기존 SSR 쪽 규칙과 동일하게 맞춤. 로컬 빌드 검증 완료
- [ ] 경력/프로젝트 소개용 포트폴리오 도메인 신설 — 매매일지(TRADE_LOG)는 제외 예정 도메인이라 REST 전환 우선순위에서 뺐고, 대신 실제 포트폴리오 사이트에 쓰일 새 도메인(`PortfolioItem`)을 추가함. 메인 목록은 요약만, 상세가 필요한 항목만 상세 API로 연결하는 구조(이전에 정했던 "요약 + 상세 페이지" 원칙 반영). 기존 암호화폐 보유현황 기능(Holding/PortfolioController)과 이름이 겹치지 않도록 `/api/portfolio-items`로 분리. CRUD 전체를 한 번에 만들었고, Flyway 마이그레이션(`V2__add_portfolio_item.sql`)도 같이 추가. 로컬 빌드에서 Flyway가 V2를 실제로 적용하는 것까지 확인 완료
- [x] REST API 전환 대상 도메인 확정 — 뉴스(Article, 코인 시황 RSS 수집)와 기존 암호화폐 보유현황(Holding/PortfolioController)은 매매일지와 같은 트레이딩 계열 콘텐츠로 판단해 최종 포트폴리오 사이트에서 제외하기로 함. 두 도메인 모두 REST API로 전환하지 않고 레거시 상태로 남겨둠(향후 별도 프로젝트로 분리될 수 있음). 이로써 REST API 전환은 사이트에 실제로 쓰일 도메인(Post-일반 글, PortfolioItem) 기준으로 완료

- [x] React 프론트엔드 초기 설정 — 기존 저장소 안에 `frontend/` 폴더로 추가(모노레포, 배포/버전 관리를 단순하게 유지하기 위함). 빌드 도구는 Vite 선택 — 지금 백엔드가 이미 API-First(JSON만 반환)로 전환되어 있어 화면 렌더링을 서버가 담당할 필요가 없고, Next.js처럼 별도 서버 프로세스를 자체 호스팅 환경에 추가로 얹지 않아도 됨. 개발 중 `/api` 요청은 Vite 프록시로 로컬 백엔드(8081)에 그대로 전달되도록 설정. `npm install` + `npm run dev` 로컬 실행 후 프론트엔드에서 백엔드 API 호출까지 성공 확인 완료

- [x] React 포트폴리오 목록/상세 화면 구현 — `/`(목록), `/portfolio/:id`(상세)로 라우팅 구성(react-router-dom 추가). 요약 API로 카드 목록을 보여주고 클릭 시 상세 API를 호출하는 구조로, 백엔드 쪽에 이미 적용된 "요약 + 상세" 원칙을 프론트에도 그대로 반영. 아직 등록된 데이터가 없어 빈 상태 문구만 확인, 실제 데이터는 관리자 쓰기 화면이 만들어진 뒤 입력 예정

- [x] React 관리자 모드 전환 UI + 포트폴리오 항목 작성/수정/삭제 화면 — AuthContext로 관리자 상태를 전역 공유, 상단 "설정" 버튼으로 코드 입력 → 관리자 모드 전환. 관리자 모드일 때만 추가/수정/삭제 버튼 노출. CSRF 토큰은 상태 변경 요청마다 새로 받아와서 헤더에 실어 보냄. 로컬 실행에서 추가/수정/삭제까지 실제 동작 확인 완료

- [x] 다크/라이트 모드 전환 — 색상을 CSS 커스텀 프로퍼티(토큰)로 전환해 `[data-theme]` 속성값에 따라 전체 배색이 바뀌도록 구성. 첫 방문 시엔 시스템 설정을 따르고, 우측 상단 아이콘으로 전환하면 그 뒤로는 localStorage에 저장해 다음 방문에도 유지됨

- [x] React 디자인 리뉴얼 — 예전에 만들어둔 정적 포트폴리오 아티팩트의 배색(짙은 그린 포인트 + 오프화이트)과 폰트(Libre Franklin/IBM Plex Sans/IBM Plex Mono)를 그대로 이식. 초기 콘텐츠는 그 아티팩트에 이미 있던 실제 내용(경력 1건, 프로젝트 3건)을 `frontend/scripts/seed-portfolio.mjs`로 한 번에 입력. 로컬 실행 확인 완료

- [x] 홈을 한 페이지 스크롤 구조로 전환 — About/Skills/Experience·Projects/Certifications/Contact를 전부 "/" 하나에 섹션으로 배치. 상단 탭은 라우트 이동이 아니라 해당 섹션으로 부드럽게 스크롤 이동(홈이 아닌 화면에서 탭 클릭 시엔 홈으로 돌아가면서 그 섹션으로 이동). IntersectionObserver로 지금 보고 있는 섹션을 추적해 탭 하이라이트에 반영. 프로젝트 상세·관리자 작성/수정 화면은 기존처럼 별도 라우트로 유지. 로컬 실행 확인 완료

- [x] 일반 글(Post, INSIGHT 타입) 작성/조회 화면을 React로 이전 — 처음에는 "Blog" 탭을 홈 스크롤 밖 `/blog` 전용 라우트로 분리했으나, 탭 클릭 시에만 라우트가 바뀌어 다른 탭들과 동작이 달라 어색하다는 피드백으로 두 차례 조정함. (1) 탭 자체는 다른 탭과 동일하게 홈 안에서 앵커 스크롤만 하도록 통일하고, 최신 글 5개 미리보기 섹션을 홈에 추가 — 전체 목록/페이지네이션은 미리보기의 "더보기" 버튼을 눌렀을 때만 별도 라우트(`/blog`)로 이동. (2) 이름이 "Blog"라는 것과 About~Certifications(이력/커리어 흐름) 사이 위치가 어색하다는 피드백으로, 명칭을 "Archive"(공부 기록까지 포괄하는 느낌)로 바꾸고 위치도 Certifications 뒤·Contact 바로 앞(보조 콘텐츠 자리)으로 재배치. 관련 컴포넌트/라우트도 전부 Blog* → Archive*, `/blog` → `/archive`로 이름 변경(백엔드 Post/INSIGHT 타입명은 내부 구현이라 그대로 유지). 매매일지(TRADE_LOG) 전용 필드는 다루지 않음 — 제외 도메인. 로컬 실행 확인 완료

- [x] 레거시 SSR 컨트롤러/템플릿 및 제외 확정된 Article(뉴스)/Holding(암호화폐 보유현황)/매매일지(TRADE_LOG) 관련 코드 전면 삭제 — React 쪽 기능(포트폴리오, 아카이브)이 레거시 화면을 완전히 대체한 뒤 진행한 Strangler Fig의 마지막 단계. 정리 전 세 기능의 실사용 여부를 사용자에게 직접 확인: 매매일지는 더 이상 쓰지 않음(완전 삭제), 뉴스/시세 조회는 지금도 동작하지만 새 사이트와 무관(삭제), 보유현황은 이전 폼로그인 제거 때 이미 깨진 죽은 코드(삭제)로 셋 다 완전 삭제로 결정됨.
  - 컨트롤러: `PostController`(SSR), `ArticleController`, `MarketController`, `PortfolioController`(레거시 홀딩) 삭제
  - 도메인/리포지토리: `Article`, `Holding`, `PostType`, `TradePosition` 및 관련 리포지토리 삭제. `Post` 엔티티에서 매매일지 전용 필드(ticker/position/entryPrice/exitPrice/profitRate/exchange)와 더 이상 쓰이지 않는 파일 첨부(filePath) 제거 — 이제 단일 글 모델(제목/내용/작성자)만 남음
  - 서비스: `NewsService`(RSS 수집), `UpbitClient`(업비트 시세), `ClaudeClient`(Groq 기반 뉴스 요약) 삭제. `PostService`/`PostServiceImpl`에서 매매일지 수익률 계산, 대시보드 통계, 파일 업로드 로직 제거
  - 템플릿/정적 리소스: `resources/templates`, `resources/static` 전체 삭제(Thymeleaf 뷰가 더 이상 없음) — `spring-boot-starter-thymeleaf`, `thymeleaf-extras-springsecurity6`, `rome`(RSS 파서) 의존성도 pom.xml에서 제거. 이로써 백엔드는 뷰를 반환하는 컨트롤러 없이 **순수 REST API 서버**로 전환 완료
  - 설정: `WebConfig`(파일 업로드 정적 리소스 핸들러), `GlobalExceptionHandler`(Thymeleaf 에러 뷰)와 `@EnableScheduling`(스케줄러 쓰던 곳이 NewsService뿐이었음) 삭제. `SecurityConfig`에서 `/main/list`, `/panel/**`, `/portfolio/**`, `/post/delete/**`, `/uploads/**` 등 레거시 라우트 권한 설정 및 더 이상 쓰이지 않는 formLogin 로그아웃(logoutSuccessUrl) 설정 제거
  - DB: Flyway `V3__remove_trading_and_news_features.sql` 추가 — `article`/`holding` 테이블 삭제, `posts` 테이블에서 매매일지 전용 컬럼 및 `file_path` 삭제(기존에 쌓여있던 데이터도 함께 삭제됨, 사전에 사용자 확인 완료)
  - 프론트엔드: 백엔드에 `type` 필드 자체가 사라졌으므로 `ArchivePreview`/`ArchiveList`/`ArchiveForm`에서 `type=INSIGHT` 쿼리 파라미터와 작성 payload의 `type: 'INSIGHT'`도 함께 제거
  - 이 세션(샌드박스 VM)에는 Maven이 없어 실제 컴파일은 검증하지 못함 — 사용자 로컬 환경에서 `mvn spring-boot:run`으로 최초 확인 필요

## 다음 단계

- [ ] (개발 완료 후) 자체 하드웨어 상시 구동 + Cloudflare Tunnel 배포, GitHub Actions 배포 트리거를 수동(workflow_dispatch)에서 다시 push로 복원
