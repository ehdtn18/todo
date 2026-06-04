# Vercel 배포 가이드 (MySQL 유지)

이 앱은 원래 로컬 전용이지만, **클라우드 MySQL + SSL**로 바꾸면 Vercel에 배포할 수 있습니다.
코드는 이미 준비됨: `lib/db.js`가 `DB_SSL`을 지원하고, 업로드는 `BLOB_READ_WRITE_TOKEN`이 있으면 Vercel Blob을 씁니다.

## 1. 클라우드 MySQL 만들기 — TiDB Cloud Serverless (무료, 추천)

1. https://tidbcloud.com 가입 → **Serverless** 클러스터 생성(무료).
2. 클러스터 → **Connect** 에서 연결 정보 확인:
   - Host: `gateway01.xxxx.prod.aws.tidbcloud.com`
   - **Port: `4000`** (MySQL 기본 3306이 아님 — 주의)
   - User: `xxxxx.root`
   - Password: 생성/확인
   - Database: 원하는 이름(예: `todo`)
3. TiDB Serverless는 **TLS 필수** → 배포 시 `DB_SSL=true` 로 둡니다.

> 대안: **PlanetScale**(MySQL, 유료) 도 동일하게 host/user/password를 받아 쓰면 됩니다. 역시 `DB_SSL=true`.

## 2. GitHub에 코드 올리기
이미 완료: https://github.com/ehdtn18/todo (변경 후엔 `git add . && git commit -m "..." && git push`)

## 3. Vercel 프로젝트 생성
1. https://vercel.com → **Add New → Project** → GitHub의 `ehdtn18/todo` 임포트.
2. Framework: Next.js 자동 인식. 빌드 설정 기본값 그대로.

## 4. 환경 변수 설정 (Vercel → Project → Settings → Environment Variables)
| Key | Value |
| --- | --- |
| `DB_HOST` | TiDB가 준 host |
| `DB_PORT` | `4000` |
| `DB_USER` | TiDB user |
| `DB_PASSWORD` | TiDB password |
| `DB_NAME` | `todo` |
| `DB_SSL` | `true` |

> 인증 오류(자체서명 CA)가 나면 `DB_SSL_REJECT_UNAUTHORIZED=false` 추가. 서버리스 커넥션 한도가 빡빡하면 `DB_POOL_LIMIT=5`.

## 5. (선택) 파일 업로드 — Vercel Blob
이미지/파일 첨부를 쓸 거면:
1. Vercel → **Storage → Create → Blob** 스토어 생성 후 이 프로젝트에 연결.
2. 그러면 `BLOB_READ_WRITE_TOKEN`이 자동 주입되어, 업로드가 Blob에 저장됩니다(코드 수정 불필요).
3. Blob을 안 붙이면 클라우드에선 업로드만 실패하고 나머지는 정상 동작(로컬은 항상 `public/uploads` 사용).

## 6. 배포 & 확인
- **Deploy** 클릭 → 첫 `/api/tasks` 호출 시 `ensureSchema()`가 테이블을 자동 생성합니다(별도 스키마 실행 불필요).
- 배포 URL에서 할 일 추가가 되면 성공.

## 7. (선택) 기존 로컬 데이터 옮기기
로컬 MySQL의 데이터는 클라우드로 자동 이전되지 않습니다. 옮기려면:
- 로컬에서 `GET /api/tasks`·`/api/trash`·`/api/leaves` 응답(JSON)을 받아, 배포본의 동일 `POST` 엔드포인트로 보내면 됩니다(전체 교체 방식).
- 또는 `mysqldump`로 덤프 후 클라우드로 import. (필요하면 도와드릴게요.)

---

### 주의
- `.env.local`은 git에 안 올라가며(비밀번호 보호), Vercel에선 위 4번처럼 대시보드에 넣습니다.
- 로컬 개발은 그대로 `npm run dev`(localhost MySQL). 배포본만 클라우드 DB를 바라봅니다.
- Windows 작업 스케줄러 백업/복구 스크립트는 로컬 전용이라 Vercel과 무관합니다.
