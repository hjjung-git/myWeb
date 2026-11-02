# myWeb

![Java](https://img.shields.io/badge/Java%2021-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot%204-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Flyway](https://img.shields.io/badge/Flyway-CC0200?style=flat-square&logo=flyway&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-A22846?style=flat-square&logo=raspberrypi&logoColor=white)

> 기획부터 개발·배포·운영까지 직접 하는 개인 플랫폼 — **Portfolio**(나를 소개하는 이력) + **Archive**(공부하고 경험한 것을 쌓는 기록)

<!-- TODO: 현재 화면 스크린샷으로 교체 (Portfolio 첫 화면, Archive 트리 화면) -->

<br>

---

## Overview

처음엔 Spring Boot 서버를 직접 구축·운영해보는 프로젝트로 시작해, 암호화폐 매매일지 서비스까지 키웠던 서버다. 지금은 이 서버를 새로 만들지 않고 **브라운필드(Brownfield) 방식으로 점진 전환**해서 개인 포트폴리오 플랫폼으로 바꿨다 — 서버 렌더링(Thymeleaf)을 React + REST API로 분리하고, 스키마를 Flyway로 버전 관리하며, 쓰지 않는 도메인(뉴스·보유현황·매매일지)은 정리했다.

사이트는 두 축으로 구성된다.

- **Portfolio** — 한 페이지 스크롤로 보는 이력: 소개(FDE 지향), 기술 스택, 경력 사항, 프로젝트, 어학/자격증, 연락처
- **Archive** — 대분류 › 중분류 › 소분류 트리로 정리하는 기록: 전공 기초(CS)부터 AI·Backend·Graph DB까지 공부한 내용을 글로 남긴다

진행 배경과 기술적 결정은 [docs/architecture-migration-log.md](docs/architecture-migration-log.md)에 기록한다.

<br>

---

## Features

### Portfolio
- 섹션 탭 + 스크롤 위치 추적, 상세 화면에서 돌아오면 보던 위치 복원
- 경력 사항: 카드에는 회사명·재직 기간만, 상세에서 고용형태/근무 기간/부서/직급/담당 업무/퇴직 사유
- 프로젝트 카드 + 상세(기술 스택, 링크)
- 어학/자격증: 취득일·발급기관, 합격확인증 PDF 업로드/열람, 취득 예정 표시

### Archive
- 대분류 › 중분류 › 소분류 사이드바 트리, 분류별 목록, 이전/다음 글
- Obsidian Live Preview 방식의 markdown 에디터(CodeMirror 6) — 커서가 없는 줄은 서식만 보이게
- 이미지 붙여넣기/끌어놓기/첨부 → DB에 저장 후 글에 바로 표시

### 공통
- 관리자 모드(세션 인증 + CSRF)에서만 작성/수정/삭제, 조회는 누구나
- 라이트/다크 테마, Pretendard 폰트, 모바일 대응

<br>

---

## Architecture

```
브라우저
  │
  ├─ Cloudflare Pages ──── React SPA (Vite 빌드 결과물)
  │
  └─ Cloudflare Tunnel ─── Raspberry Pi (자체 호스팅, 준비 중)
                             ├─ Spring Boot REST API (/api/**)
                             └─ MySQL (Flyway로 스키마 관리, 글 이미지는 DB에 저장)
```

- 프론트와 백엔드가 서로 다른 origin이라, 프론트는 `VITE_API_BASE_URL`로 API 주소를 받고 백엔드는 CORS + 쿠키 세션으로 대응한다.
- 공유기 포트포워딩 없이 Cloudflare Tunnel로 외부에 공개한다.

<br>

---

## Tech Stack

| 분류 | 기술 |
| :--- | :--- |
| Frontend | React 18 · Vite 6 · React Router 6 · CodeMirror 6 · react-markdown (+ remark-gfm) |
| Backend | Java 21 · Spring Boot 4 · Spring Data JPA · Spring Security · Bean Validation |
| Database | MySQL · Flyway (V1~V8) |
| Deployment | Cloudflare Pages · Cloudflare Tunnel · Raspberry Pi (예정) |
| Build | Maven (mvnw) · npm |
| 레거시 (종료) | Thymeleaf · Bootstrap · H2 · AWS EC2 · AWS RDS · Nginx · Let's Encrypt |

<br>

---

## Project Milestone

<details>
<summary><b>1~4. 서버 구축 → 운영 → 보안 강화 → 서비스 확장(매매일지 플랫폼)</b> (완료, 펼쳐보기)</summary>

### 1. 서버 구축

| 단계 | 내용 | 상태 |
| :--- | :--- | :---: |
| Step 1 | 개발 환경 구성 (JDK, IDE, Spring Boot 초기화) | ✅ |
| Step 2 | DB 엔지니어링 (H2, JPA, Entity/Repository 구성) | ✅ |
| Step 3 | UI/UX 엔지니어링 (Thymeleaf, Bootstrap) | ✅ |
| Step 4 | 시스템 관리 (AWS EC2, Elastic IP, 도메인) | ✅ |
| Step 5 | 보안 엔지니어링 (Nginx, HTTPS, Let's Encrypt) | ✅ |

### 2. 유지보수 및 운영

| 단계 | 내용 | 상태 |
| :--- | :--- | :---: |
| Step 1 | 기능 및 코드 관리 (계층형 아키텍처, 검색, 파일 업로드) | ✅ |
| Step 2 | 데이터 관리 (MySQL 이관, RDS 백업) | ✅ |
| Step 3 | 사용자 인증 및 접근 제어 (Spring Security) | ✅ |
| Step 4 | 인프라 유지보수 (CI/CD, 로그 관리) | ✅ |

### 3. 보안 강화

| 단계 | 내용 | 상태 |
| :--- | :--- | :---: |
| Step 1 | Service 레이어 권한 검증 | ✅ |
| Step 2 | Rate Limiting · XSS / CSRF 방어 | ✅ |
| Step 3 | 민감정보 외부화 (환경변수 / Secrets Manager) | ✅ |
| Step 4 | 컨트롤러 보안 테스트 | ✅ |

### 4. 서비스 확장 (매매일지 플랫폼)

| 단계 | 내용 | 상태 |
| :--- | :--- | :---: |
| Step 1 | 다크 테마 · 대시보드 레이아웃 전환 | ✅ |
| Step 2 | 콘텐츠 타입 분리 (TRADE\_LOG / INSIGHT) + DB 스키마 | ✅ |
| Step 3 | 매매일지 CRUD | ✅ |
| Step 3.5 | 푸시 패널 분할 레이아웃 (사이드바 → 패널 슬라이드인) | ✅ |
| Step 3.6 | 폼 가운데 정렬 · 사이드바 설정 오버레이 | ✅ |
| Step 4 | 실시간 시세 (업비트 API) + 뉴스 자동 수집 (RSS) | ✅ |
| Step 4-B | 포트폴리오 직접 입력 (보유 현황 · 평가손익) | ✅ |
| Step 4-C | 뉴스 내부 상세보기 + AI 한국어 요약 (Groq / Llama) | ✅ |
| Step 4-D | 번역 비동기 분리 (RSS 수집↔번역 스케줄러 분리) + H2 파일 DB 전환 | ✅ |

</details>

### 5. 아키텍처 마이그레이션 · 포트폴리오 플랫폼 전환 (진행 중)

| 단계 | 내용 | 상태 |
| :--- | :--- | :---: |
| Step 1 | 로컬 개발 DB 전환 (H2 → 자체 구축 MySQL) | ✅ |
| Step 2 | Flyway 도입 (스키마 버전 관리) | ✅ |
| Step 3 | 기존 Controller REST API 전환 | ✅ |
| Step 4 | React 프론트엔드 구축 및 포트폴리오 통합 | ✅ |
| Step 5 | 레거시 SSR 및 제외 도메인(뉴스/보유현황/매매일지) 코드 정리 | ✅ |
| Step 6 | 포트폴리오 콘텐츠 관리 (경력·프로젝트·어학/자격증 CRUD, 합격확인증 PDF) | ✅ |
| Step 7 | Archive 개편 (3단계 분류 트리, markdown 라이브 에디터, 이미지 DB 저장) | ✅ |
| Step 8 | 자체 호스팅 배포 (Raspberry Pi + Cloudflare Tunnel) | ⬜ |

<br>

---

## Quick Start

사전 준비: JDK 21, Node.js 22 이상, 로컬 MySQL

```bash
# 1) 로컬 설정 파일 만들기 (DB 접속 정보 입력)
cp my-server/src/main/resources/application-local.properties.example \
   my-server/src/main/resources/application-local.properties

# 2) 백엔드 (REST API 서버, 8081) — 첫 실행 때 Flyway가 스키마를 자동으로 맞춘다
cd my-server
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run

# 3) 프론트엔드 (새 터미널에서, 5173 — 개발 중 /api 요청은 8081로 프록시)
cd frontend
npm install
npm run dev
```

접속 → http://localhost:5173

- 코드를 바꿨는데 예전 동작이 남아 있으면 `./mvnw clean spring-boot:run`으로 다시 빌드한다.
- 배포 절차 → [docs/deploy.md](docs/deploy.md)

<br>

---

## Documentation

| 문서 | 내용 |
| :--- | :--- |
| [docs/architecture-migration-log.md](docs/architecture-migration-log.md) | 아키텍처 마이그레이션 진행 기록 (결정 이유 + 진행 상황) |
| [docs/deploy.md](docs/deploy.md) | 배포 및 운영 절차 |
| [docs/cross-platform-dev.md](docs/cross-platform-dev.md) | macOS · Windows 개발 환경 통일 점검 |
| [docs/study-notes.md](docs/study-notes.md) | 핵심 개념 정리 (서버 구축~보안 강화 경험 기반) |
