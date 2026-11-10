# myWeb 재배포 절차

> 최종 업데이트: 2026-11-10 · 홈서버(노트북) 운영 기준. 기존 `deploy.md`(AWS/EC2 기준 계획)와 별개로, 현재 운영 환경의 재배포 절차만 정리함.

## 구성 한눈에

- 프론트: GitHub `main`에 push → Cloudflare(Workers Builds)가 `frontend/`를 자동 빌드·배포. 서버 작업 없음.
- 백엔드: 서버 노트북(hostname `myweb`, 계정 `jaeroj9`)의 systemd 서비스 `myweb`.
  - 실행 파일 `/opt/myweb/app.jar`, 환경변수 `/etc/myweb.env` (DB 비밀번호 등, 저장소에 없음)
  - 서버에는 소스 코드가 없고 jar만 있음 → **맥에서 빌드해서 jar를 보내 교체**
- 서버 접속: Tailscale 주소(`tailscale ip -4`로 확인한 100.x.x.x)로 어디서든 SSH

## 백엔드 재배포 순서

### 0) 코드 수정 후 커밋·푸시 (맥)

평소처럼 커밋하고 push.

### 1) 맥에서 빌드 — 맥북 터미널

```
cd ~/Desktop/myWeb/my-server
./mvnw clean package -DskipTests
ls target/*.jar
```

`target/` 안에 jar 파일이 하나 보이면 성공.

### 2) jar를 서버로 전송 — 맥북 터미널

```
scp target/*.jar jaeroj9@<서버 Tailscale 주소>:~/app.jar.new
```

### 3) 서버에서 교체 — 서버 안(SSH)

```
~/myweb-backup.sh                      # DB 마이그레이션(Flyway)이 있을 수 있어 먼저 백업
cp /opt/myweb/app.jar /opt/myweb/app.jar.prev
sudo install -o jaeroj9 -g jaeroj9 -m 644 ~/app.jar.new /opt/myweb/app.jar
sudo systemctl restart myweb
sudo systemctl status myweb --no-pager | head -5
journalctl -u myweb -n 30 --no-pager
```

`active (running)`이고 로그에 에러가 없으면 정상.

### 4) 동작 확인 — 맥북 터미널

```
curl -s https://api.hnjnjng.win/api/certifications | head -c 200
```

데이터가 나오면 성공. 브라우저에서 `https://hnjnjng.win`도 확인.

## 문제가 생기면 되돌리기 — 서버 안(SSH)

```
cp /opt/myweb/app.jar.prev /opt/myweb/app.jar
sudo systemctl restart myweb
```

- 주의: jar를 되돌려도 **DB 마이그레이션은 되돌아가지 않음**. 마이그레이션이 포함된 배포였다면 3단계 백업(`~/backups/`)으로 복원해야 함.

## 참고

- 로그: `journalctl -u myweb -f` (실시간), `/opt/myweb/logs/`
- 환경변수 변경: `sudo nano /etc/myweb.env` → `sudo systemctl restart myweb`
- CORS 허용 주소는 `FRONTEND_ORIGIN` (현재 `https://hnjnjng.win`)
- 백업: 매일 03:30 cron, `~/backups/`에 14일 보관 (`~/myweb-backup.sh`)
