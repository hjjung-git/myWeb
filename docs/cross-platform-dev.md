# 크로스플랫폼(macOS + Windows) 개발 환경 점검

> 2026-10-01 기준: 맥북(macOS) 외에 집 Windows 데스크톱도 개발 기기로 함께 쓰기로 하면서, 프로젝트가 OS에 관계없이 똑같이 동작하는지 점검한 결과.

## 결론

구조적으로는 이미 크로스플랫폼에 문제가 없는 상태였다. 레거시 정리 과정에서 파일 업로드/로컬 파일 경로 처리 코드가 통째로 삭제되어, OS별 경로 구분자(`/` vs `\`) 문제 자체가 발생할 여지가 없어졌기 때문이다. 이번 점검에서 발견된 유일한 실제 리스크(줄바꿈 설정 누락)는 `.gitattributes`를 추가해 바로 조치했다.

## 점검 항목과 결과

- **Maven 래퍼**: `my-server/mvnw`(Unix용)와 `my-server/mvnw.cmd`(Windows용)가 둘 다 저장소에 있음 — Windows에서는 `mvnw.cmd`, macOS에서는 `./mvnw`로 실행하면 됨. 추가 설치 없이 둘 다 바로 동작.
- **Java 버전**: `pom.xml`에 `java.version=21`로 고정 — Windows에도 JDK 21을 설치하면 동일하게 빌드됨. 설치 방법만 OS별로 다를 뿐 버전 요구사항은 플랫폼과 무관.
- **프론트엔드 빌드 스크립트**: `frontend/package.json`의 `dev`/`build`/`preview` 스크립트가 전부 `vite`/`vite build`/`vite preview` 단일 명령. `&&`로 이어붙인 유닉스 전용 셸 체이닝이나 `rm -rf`, `cp` 같은 유닉스 전용 명령이 전혀 없어 `npm run dev`/`npm run build`가 Windows에서도 그대로 동작.
- **파일 경로 하드코딩**: 백엔드 소스 전체를 검색했지만 `/Users/...` 같은 맥 전용 절대경로, `File.separator` 수동 처리, 파일 업로드 저장 경로 로직이 전혀 없음 — 레거시 정리 때 Article/Holding 관련 파일 업로드 기능이 완전히 삭제된 결과. OS별 경로 구분자 문제가 애초에 생길 자리가 없음.
- **셸 스크립트 의존성**: 저장소에 `mvnw` 외의 `.sh` 스크립트가 없음 — 빌드·실행 과정에 유닉스 셸이 필수인 단계가 없음.
- **줄바꿈(line ending) 설정 — 유일하게 발견된 공백**: `.gitattributes`가 없어서, macOS(LF)와 Windows(기본 `core.autocrlf=true`로 체크아웃 시 CRLF 변환) 사이를 오가며 커밋하면 줄바꿈이 섞이거나 diff가 지저분해질 수 있었음.
  → **조치 완료**: `.gitattributes`를 추가해 텍스트 파일은 저장소에 LF로 통일하고, Windows 전용 스크립트(`*.cmd`, `*.bat`)만 예외적으로 CRLF를 유지하도록 설정함. Windows 데스크톱이 아직 레포를 처음 clone하지 않은 시점이라 부작용 없이 적용 가능했음.

## Windows에서 처음 설정할 때 필요한 것 (참고)

- JDK 21, Node.js, MySQL — macOS와 동일하게 설치만 하면 됨 (설치 방법만 OS별로 다름: macOS는 보통 Homebrew, Windows는 공식 설치파일 또는 winget)
- 백엔드 실행: `cd my-server` 후 `mvnw.cmd spring-boot:run` (macOS의 `./mvnw spring-boot:run`과 동일)
- 프론트엔드 실행: macOS와 동일하게 `npm install && npm run dev`
- `application-local.properties`는 `.gitignore`에 포함되어 있어 각 기기(맥북/Windows 데스크톱)에서 각자 `application-local.properties.example`을 복사해 자기 환경의 DB 접속정보를 채워야 함 — 원래부터 기기마다 각자 파일을 유지하는 구조라 멀티 기기 사용을 전제로 이미 설계되어 있었음.

## 범위 밖 — 상시 구동 서버와는 무관

이 점검은 "개발용 기기(맥북/Windows 데스크톱)에서 코드를 똑같이 돌릴 수 있는가"에 대한 것이다. 실제 공개 서비스를 상시 구동할 기기(라즈베리파이/미니PC 등, 별도 구매 예정)는 Linux 기반으로 운영할 예정이므로 이 문서의 점검 대상이 아니다. 배포 관련 내용은 [docs/deploy.md](deploy.md) 참고.
