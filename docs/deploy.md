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
3. 환경변수로 API 베이스 URL을 `https://api.<내 서브도메인>`으로 지정 (현재 프론트엔드는 상대 경로 `/api/...`로 호출하므로, 배포 시에는 이 베이스 URL을 요청 앞에 붙이도록 `frontend/src/lib/api.js`를 조정해야 한다 — 기기 설치 단계에서 실제로 반영)
4. main 브랜치에 push하면 Cloudflare가 자동으로 빌드·배포한다 (이 부분만 자동화되어 있고, 백엔드 쪽은 위의 수동 배포 절차를 따른다)

<br>

---

## (참고, 레거시) AWS EC2 배포

AWS 계정 정지로 더 이상 쓰지 않는 방식이다. `git log` 상의 과거 버전에 EC2/Nginx/Let's Encrypt 기준 절차가 남아있으니, 필요하면 그쪽을 참고한다.
