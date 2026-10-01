# Deployment Guide

> **현재 상태**: 상시 구동 전용 저전력 기기(라즈베리파이/미니PC 등, 2026-10-01 기준 약 3주 뒤 구매 예정)를 구하는 대로, 자체 소유 하드웨어 + Cloudflare Tunnel 방식으로 전환한다. 프론트엔드는 기기와 분리해 Cloudflare Pages에 올린다(정적 파일이라 굳이 같이 상시 구동할 이유가 없고, 기기가 잠시 꺼져도 사이트 자체는 떠 있고 API 호출만 실패하는 편이 더 안전하다). 초기에는 GitHub Actions 자동 배포 없이 수동 배포로 시작하고(집 네트워크에 GitHub 빌드 서버가 SSH로 들어올 통로를 만드는 작업은 별도 설정이 필요해 일이 늘어남), 안정화되면 자동화를 다시 검토한다. 기기를 구하기 전까지는 이 문서가 계획 단계이고, 실제로 기기에 설치해보면서 세부 내용을 갱신해 나간다. 진행 배경은 [docs/architecture-migration-log.md](architecture-migration-log.md) 참고.

---

## 무료 호스팅 여부 검증 (2026-10-01)

Cloudflare Pages와 Cloudflare Tunnel을 실제로 비용 없이, 얼마나 오래 쓸 수 있는지 공식 문서 기준으로 확인한 결과.

**Cloudflare Pages**
- 공식 limits 문서 기준 무료 플랜: 월 500회 빌드, 동시 빌드 1개, 빌드 타임아웃 20분, 사이트당 파일 2만 개, 파일당 최대 25MiB, 프로젝트당 커스텀 도메인 100개, 계정당 프로젝트 100개.
- 이 프로젝트 규모(정적 React 빌드 하나)로는 전혀 문제가 되지 않는 한도.
- 문서 어디에도 체험판/기간 제한이 없음 — 상시 무료 티어.

**Cloudflare Tunnel**
- 공식 제품 페이지에 "Available on all plans"라고 명시 — Tunnel 연결 자체(outbound-only 연결, `cloudflared`, DNS 라우팅)는 무료 플랜을 포함한 모든 플랜에서 제공됨.
- 공식 블로그(Tunnel for Everyone, 2021)에서도 "any organization can use the secure, outbound-only connection feature of the product at no cost"라고 명시.
- 다만 "무료"는 Tunnel 연결 자체에 대한 것이고, Cloudflare Zero Trust(사설 네트워크/VPN 대체, 로그인 게이트 같은 기능)는 별도로 유료 플랜·"seat"(사용자 좌석) 개념이 있음. 커뮤니티에서 언급되는 "무료 플랜 50명 제한"은 Zero Trust Access의 seat 수 제한이며, 공식 문서는 "공개 애플리케이션(public applications)" 용도와 "Cloudflare One Tunnel"(사설 네트워크 용도)을 명시적으로 구분함.
- 이 프로젝트는 로그인 없이 누구나 접근 가능한 공개 API를 `api.<서브도메인>`으로 노출하는 용도이므로 seat 제한과 무관 — 비용 없이 쓸 수 있음.

**종합**: 두 서비스 모두 "일정 기간만 무료"가 아니라 상시 무료 티어로 운영 중이고, 공식 문서에 만료일이나 체험판 안내가 없음. 다만 Cloudflare도 민간 기업이라 요금제를 바꿀 가능성 자체는 항상 있으므로, "현재(2026-10-01) 기준 공식 정책상 상시 무료"라는 뜻이지 평생 보장이라는 뜻은 아님 — 장기적으로는 가끔 재확인이 필요함.

Sources:
- [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)
- [Tunnel for Everyone](https://blog.cloudflare.com/tunnel-for-everyone/)
- [50 user limit on free plan (Community)](https://community.cloudflare.com/t/50-user-limit-on-free-plan/546057)

<br>

---

## 프론트/백엔드 분리 배포 대비 — Cross-Origin 설정 (2026-10-01)

기기 구매 전이지만 코드 레벨에서 미리 끝내둘 수 있는 부분이라 반영함. Cloudflare Pages(프론트)와 Cloudflare Tunnel(백엔드)로 배포가 분리되면, 지금까지와 달리 둘이 서로 다른 origin이 되어 브라우저가 기본적으로 요청을 막는다(CORS) — 이걸 그냥 두면 로그인 세션 쿠키도 전달되지 않는다. 기기가 아직 없어도 코드 자체는 지금 끝내둘 수 있어서 미리 반영했다.

- **프론트엔드**: `frontend/src/lib/api.js`가 `VITE_API_BASE_URL` 환경변수로 백엔드 전체 URL을 받도록 수정(비어 있으면 기존처럼 상대 경로, 즉 로컬 개발에는 영향 없음). `fetch`의 `credentials`도 `'same-origin'` → `'include'`로 변경 — cross-origin 요청에도 쿠키를 실어 보내기 위함(로컬 개발에서는 same-origin이라 동작 차이 없음).
- **백엔드**: `SecurityConfig`에 CORS 설정 추가 — 허용 origin은 `app.cors.allowed-origin` 프로퍼티(prod는 `FRONTEND_ORIGIN` 환경변수)로 지정하고, `allowCredentials=true`로 쿠키 전달을 허용. 로컬 개발은 Vite 프록시로 인해 애초에 same-origin이라 CORS 필터 자체가 안 타므로 영향 없음.
- **세션 쿠키**: prod 프로파일에만 `SameSite=None; Secure`로 설정(cross-site 쿠키는 이 조합이 아니면 브라우저가 거부함) + `server.forward-headers-strategy=framework` 추가(Cloudflare Tunnel이 HTTPS를 처리하고 내부적으로는 HTTP로 넘어오므로, Tunnel이 보내는 X-Forwarded-* 헤더를 신뢰하도록 설정하지 않으면 Spring이 요청을 HTTP로 오인해 Secure 쿠키를 내려주지 않는다).
- **기기 설치 시 추가로 설정해야 할 값**: Cloudflare Pages 프로젝트 환경변수에 `VITE_API_BASE_URL`, 기기 systemd 서비스에 `FRONTEND_ORIGIN` — 둘 다 실제 도메인이 정해진 뒤 채워 넣으면 된다(위 systemd 섹션 예시에 반영해둠).

<br>

---

## 로컬 실행

```bash
# 백엔드 (8081)
cd my-server
mvn spring-boot:run

# 프론트엔드 (5173 — 개발 중 /api 요청은 8081로 프록시됨)
cd frontend
npm install
npm run dev
```

접속 → http://localhost:5173

> 백엔드에 `spring-boot-devtools`를 추가해뒀다(2026-10-01) — 클래스 파일이나
> `application-local.properties`/`logback-spring.xml` 같은 설정 파일이 바뀌면 서버가 자동으로 재시작된다.
> 단, devtools는 `target/classes`가 실제로 갱신돼야 감지하므로, 뭔가가 그걸 다시 컴파일해줘야 한다.
> IntelliJ에서 코드는 편집하되 서버는 IDE 실행이 아니라 별도 터미널(`mvn spring-boot:run`)로 띄우는
> 방식이면, 아래 두 가지를 모두 설정해야 동작한다(둘 중 하나만 하면 안 됨 — 실제로 이 프로젝트에서
> 둘째 항목이 기본값으로 안 맞춰져 있어서 처음엔 재시작이 안 됐었다):
>
> 1. `Settings > Build, Execution, Deployment > Compiler`에서 **Build project automatically** 켜기
> 2. `Project Structure(⌘;) > Modules > my-server > Paths` 탭에서 "Use module compile output path"를
>    선택하고 Output path를 `my-server/target/classes`, Test output path를
>    `my-server/target/test-classes`로 직접 지정 — 이 프로젝트는 `.idea/misc.xml`의 기본 출력 경로가
>    `target/classes`가 아니라 `out/`으로 돼 있어서, 1번만 켜면 auto-make가 `out/`에 컴파일하고
>    devtools가 보는 `target/classes`는 안 바뀌는 상태가 된다
>
> 설정 후 `Build > Rebuild Project` 한 번 실행. 그 다음부터는 코드/설정 파일 저장 후 에디터 밖으로
> 포커스만 옮기면(터미널 클릭 등) 자동 컴파일 → devtools가 감지해 재시작까지 이어지고, 터미널 콘솔에
> "Restarting due to..." 로그가 뜬다. (2026-10-01 실제로 이 두 단계로 동작 확인 완료)

<br>

---

## 상시 구동 기기 준비 (최초 1회)

1. OS 설치 (Raspberry Pi OS 또는 가벼운 Linux 배포판)
2. Java 21 설치
3. MySQL 설치 및 구동 — 기존 로컬 개발 DB와 별개로, 이 기기에서 직접 운영할 DB 인스턴스 (하이브리드 DB 전략: 자체 구축 MySQL로 온프레미스 운영 경험 확보)
4. `cloudflared` 설치 및 로그인(`cloudflared tunnel login`)
5. 터널 생성 및 라우팅 등록

   ```bash
   cloudflared tunnel create myweb-api
   cloudflared tunnel route dns myweb-api api.<내 서브도메인>
   ```

6. `cloudflared`를 systemd 서비스로 등록해 기기 재부팅 시 자동 시작되게 한다

<br>

---

## 백엔드 배포 (수동, 최초 버전)

### 1. 빌드

```bash
cd my-server
mvn clean package -DskipTests
```

`target/my-server-0.0.1-SNAPSHOT.jar` 생성 확인

### 2. 기기로 전송

같은 네트워크(집 와이파이)에 있을 때 `scp`로 직접 전송한다. 원격지에서는 아직 SSH로 기기에 들어갈 통로가 없으므로, 업데이트할 때는 집에서 맥북으로 전송하는 방식을 기본으로 한다.

```bash
scp target/my-server-0.0.1-SNAPSHOT.jar <기기 사용자>@<기기 로컬 IP>:~/
```

### 3. 실행

```bash
# systemd 등록 후 사용 권장
sudo systemctl start my-server
```

<br>

---

## systemd 서비스 등록 (최초 1회)

기기 재부팅 시 Spring Boot 애플리케이션이 자동으로 실행되도록 설정한다.

### 1. 서비스 파일 생성

```bash
sudo vi /etc/systemd/system/my-server.service
```

아래 내용 입력

```ini
[Unit]
Description=My Server Spring Boot Application
After=network.target

[Service]
User=<기기 사용자>
WorkingDirectory=/home/<기기 사용자>
Environment=DATABASE_URL=jdbc:mysql://localhost:3306/<DB_NAME>
Environment=DATABASE_USERNAME=<DB_USERNAME>
Environment=DATABASE_PASSWORD=<DB_PASSWORD>
Environment=FRONTEND_ORIGIN=https://<Cloudflare Pages 도메인>
ExecStart=/usr/bin/java -jar /home/<기기 사용자>/my-server-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 2. 서비스 등록 및 시작

```bash
sudo systemctl daemon-reload
sudo systemctl enable my-server    # 부팅 시 자동 시작 등록
sudo systemctl start my-server     # 즉시 시작
```

> 서비스 파일에는 DB 비밀번호 등 민감정보가 포함되어 있으므로 권한을 제한한다.
> ```bash
> sudo chmod 600 /etc/systemd/system/my-server.service
> ```

### 3. 상태/로그 확인

```bash
sudo systemctl status my-server

# 실시간 로그
sudo journalctl -u my-server -f
```

<br>

---

## 프론트엔드 배포 (Cloudflare Pages)

1. Cloudflare 대시보드에서 Pages 프로젝트 생성, GitHub 저장소(myWeb) 연결
2. 빌드 설정
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Build output directory: `dist`
3. 환경변수 `VITE_API_BASE_URL`에 `https://api.<내 서브도메인>` 지정 (프론트엔드 코드는 이미 이 환경변수를 읽도록 준비돼 있음 — `frontend/.env.example` 참고, 빈 값이면 기존처럼 상대 경로로 동작)
4. main 브랜치에 push하면 Cloudflare가 자동으로 빌드·배포한다 (이 부분만 자동화되어 있고, 백엔드 쪽은 위의 수동 배포 절차를 따른다)

<br>

---

## (참고, 레거시) AWS EC2 배포

AWS 계정 정지로 더 이상 쓰지 않는 방식이다. `git log` 상의 과거 버전에 EC2/Nginx/Let's Encrypt 기준 절차가 남아있으니, 필요하면 그쪽을 참고한다.
