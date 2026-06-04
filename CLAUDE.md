# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code에 대한 가이드를 제공합니다.

## 프로젝트 개요

**To-do APP v.2** — Next.js + MySQL 기반 할 일 관리 웹 애플리케이션.

`REFERENCE/index.html`(바닐라 JS 단일 파일, 토스 스타일 디자인)을 Next.js로 이식한 프로젝트.
**로컬 단독 사용 전용**이며 로그인/인증 기능은 없다. 단일 사용자가 하나의 `tasks` 테이블을 사용한다.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: JavaScript (JSX) — TypeScript 미사용
- **데이터베이스**: MySQL (`mysql2/promise` 드라이버)
- **스타일링**: 순수 CSS (`app/globals.css`, 참고 파일의 CSS를 그대로 이식)
- **상태 관리**: React 상태 미사용 — 참고 앱의 명령형 DOM 로직을 그대로 이식

## 아키텍처 (중요)

참고 앱은 `contenteditable` 블록 에디터·`innerHTML` 렌더링 등 **명령형 DOM 조작**에 강하게 의존한다.
이를 React로 재작성하지 않고 **그대로 이식**하기 위해 다음 구조를 사용한다:

- [app/components/TodoApp.jsx](app/components/TodoApp.jsx) — `"use client"` 컴포넌트.
  - 마크업은 `dangerouslySetInnerHTML`로 원본 HTML을 그대로 삽입 (JSX 변환 안 함).
  - 원본 IIFE 로직은 `runApp()` 함수로 옮겨 `useEffect`에서 1회 실행.
  - `document`/`window` 레벨 리스너에는 `{signal}`을 붙이고, 동적 생성한 `cal` 엘리먼트는
    `created` 배열에 담아 언마운트 시 정리한다.
  - `next.config.mjs`에서 `reactStrictMode: false` — 이중 실행으로 인한 중복 초기화 방지.
- **저장 계층만 교체**: 원본의 `localStorage`(`store.get/set`) 중 할 일 데이터(`careid_todos`)는
  `/api/tasks`(MySQL)로, 뷰/레이아웃 환경설정(`careid_view`/`careid_layout`)은 그대로 `localStorage` 사용.

### 데이터 흐름

- 로드: `load()` → `GET /api/tasks` → task 배열 → 명령형 렌더.
- 저장: 모든 변경 후 `save()` → 전체 tasks 배열을 `POST /api/tasks`로 전송 →
  서버가 `tasks` 테이블을 **트랜잭션으로 전체 교체**(DELETE 후 일괄 INSERT).
  로컬 단일 사용자 기준의 단순·확실한 방식이다.

## 데이터베이스

로컬 MySQL. 접속 정보는 [.env.local](.env.local)에 있다 (로컬 전용이라 보안 비중 낮음).

| 항목 | 값 |
| --- | --- |
| Host | `localhost` |
| Port | `3306` |
| User | `root` |
| Password | `1234` |
| Database | `todo` |

- 스키마: [db/schema.sql](db/schema.sql) — `tasks` 테이블 하나.
  앱 최초 API 호출 시 [lib/db.js](lib/db.js)의 `ensureSchema()`가 `CREATE TABLE IF NOT EXISTS`로 자동 생성하므로 수동 실행은 선택사항.
- 테이블 2개: **tasks**, **trash**(삭제된 항목, 복원/영구삭제용 — `deleted_at` 추가).
- tasks 컬럼: `id`(uid), `title`, `body`(마크다운), `start_date`, `end_date`,
  `start_time`/`end_time`(`HH:MM`, 기본 09:00/18:00), `pri`(high|mid|low), `done`,
  `created`(epoch ms), `history`(JSON), `sort_order`.
- 시작 전 MySQL 서버가 실행 중이고 `todo` DB가 존재해야 한다.
- API: `GET/POST /api/tasks`, `GET/POST /api/trash` (둘 다 전체 배열 교체 방식).
  공통 헬퍼는 [lib/db.js](lib/db.js)의 `taskToValues`/`rowToTask`/`rowToTrash`.
- task 객체: `{id,title,body,start,end,startTime,endTime,pri,done,created,history}`.
  trash 객체는 여기에 `deletedAt` 추가.

## 주요 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:9803)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 (포트 9803)
npm run lint     # ESLint 검사
```

> 포트는 **9803** 으로 고정되어 있다 (`package.json`의 `-p 9803`).

> ⚠️ **개발 서버는 사용자가 직접 실행한다.** (사용자 지시, 2026-06-02) Claude는 `npm run dev`/`npm run start` 등 서버를 **임의로 띄우거나 재시작하지 않는다.** 서버 기동·재시작이 필요하면 사용자에게 요청한다. (동작 검증은 사용자가 이미 띄워 둔 서버에 대한 **읽기 전용 확인**으로만.)
> - 단, `lib/db.js`는 핫리로드 때마다 풀이 재생성되지 않도록 풀을 `globalThis.__todoPool`에 캐싱한다(MySQL "Too many connections" 방지). 이 캐싱을 되돌리지 말 것.

## 프로젝트 구조

```
To-do APP v.2/
├── REFERENCE/index.html   # 원본 바닐라 JS 앱 (이식 기준, 수정 금지)
├── DOCUMENT/              # 기획 문서 (idea.md, function.md)
├── app/
│   ├── layout.js          # 루트 레이아웃 (Pretendard 폰트 로드)
│   ├── page.js            # 홈 — TodoApp 렌더
│   ├── globals.css        # 이식된 전체 CSS
│   ├── components/TodoApp.jsx   # 핵심 클라이언트 컴포넌트
│   ├── api/tasks/route.js # GET(조회) / POST(전체 교체 저장)
│   └── api/trash/route.js # 휴지통 GET / POST
├── lib/db.js              # MySQL 풀, ensureSchema, rowToTask
├── db/schema.sql          # tasks 테이블 스키마
└── .env.local            # DB 접속 정보
```

## 구현된 기능

- 할 일 추가/수정/삭제(휴지통), 완료 토글, 우선순위, 기간(시작~마감) + **시작/마감 시간**
- 블록 에디터: `/` 슬래시 명령 + **Notion식 마크다운 단축키**(`# `, `- `, `1. `, `> `, `--- ` 등)
- 3가지 뷰: 리스트(행/카드형, 카드 자세히보기), 칸반(카드 클릭→수정, 드래그앤드롭),
  달력 **일/주/월** 전환(월·주: 일정 바, 일: 시간 타임라인, 진행중 막대 강조, 공휴일)
- 필터/정렬, 리스트 완료 숨기기, 수정 이력+롤백, **다크/라이트 모드**, **휴지통(복원/영구삭제)**
- 진행률 링, 상단 토스트, 마이크로 인터랙션

## 에디터 블록 (노션식)

- 슬래시(`/`) 메뉴 + 마크다운 단축키: 텍스트, 제목1~4(`#`~`####`), 글머리(`-`), 번호(`1.`),
  할일(`[]`), 토글(`>`), 콜아웃, 인용(`"`), 표, 구분선(`---`), 이미지/동영상/파일, 코드(```` ``` ````).
- **엔터=새 블록**, Shift+엔터=블록 내 줄바꿈. 한글 IME 대응 위해 `beforeinput`(insertParagraph)으로 처리.
- 본문은 마크다운 문자열로 저장. 표준 외 블록은 커스텀 마커 사용:
  콜아웃 `<!--callout-->`, 토글 `<!--toggle-->`, 동영상 `<!--video-->url`, 파일 `<!--file:이름-->url`,
  이미지 `![](url)`, 할일 `- [ ]/[x]`, 코드 ```` ``` ````, 표 `| a | b |` 파이프 테이블.
  이 마커는 `serialize`/`loadMarkdown`(에디터)와 `mdToHtml`(미리보기) 세 곳에서 동일하게 처리해야 한다.
- 미디어: [app/api/upload/route.js](app/api/upload/route.js)가 `public/uploads`에 저장하고 `/uploads/..` 경로 반환. URL 입력도 가능.

## 신규/주의 포인트

- **다크모드**: `document.documentElement[data-theme]` + CSS 변수 오버라이드(`:root[data-theme="dark"]`),
  localStorage(`careid_theme`) 저장. SVG 색은 표현 속성에 `var()`가 안 먹으므로 CSS(`.ring-track`,`#prog`)로 지정.
- **시간 피커**: 날짜 범위 선택 팝업(`cal`) 하단에 native `type=time` 2개. 콜백 `cb(start,end,startTime,endTime)`.
- **휴지통**: `del()`은 tasks→trash 이동 후 `save()`+`saveTrash()`. 영구삭제는 휴지통에서만.
- 완료 토글이 순서를 바꾸지 않도록 `sortT`에서 done 우선정렬 제거(대신 "완료 숨기기").
- **공휴일·주말 포함(`incHol`)**: 기본 false. false면 달력에서 기간 내 주말·공휴일 칸을 제외(막대가 끊김).
  `weekSegs`가 연속 구간으로 분할 렌더, 일간 보기는 `evs` 필터에서 제외. `isExcludedDay(iso)` 헬퍼 사용.
- 리스트 기본 정렬은 **등록순**(`sortBy="created"`).
- **Next dev 뱃지**: `next.config.mjs`의 `devIndicators:false` — 절대 제거 금지(사용자 요청).

## ⚠️ 데이터 안전 (최우선 · 절대 규칙)

- **사용자가 명시적으로 요청하지 않는 한 DB 데이터를 절대 삭제하지 않는다.** (사용자 지시, 2026-06-02)
  - 금지: `POST /api/tasks`·`/api/trash`에 빈 배열 보내기, 파괴적 스모크 테스트(넣었다 지우기), `DELETE`/`TRUNCATE`/`DROP` 실행, 행을 줄이는 모든 작업.
  - `POST /api/tasks`·`/api/trash`는 **전체 배열 교체**(DELETE 후 INSERT)다. 빈/불완전 배열을 보내면 데이터가 사라진다 — 테스트로라도 보내지 말 것.
  - API 동작 확인은 **읽기 전용(GET/SELECT)** 으로만. 쓰기 검증이 꼭 필요하면 먼저 사용자에게 확인받는다.
- 복구 수단: MySQL 바이너리 로그가 **ON(ROW)** 이라, 사고 시 `mysqlbinlog --read-from-remote-server ... --base64-output=DECODE-ROWS --verbose <binlog>`로 삭제된 행을 복원할 수 있다.

## 백업 / 복구

- **백업 DB**: `todo_backup` — `snapshots` 테이블에 본 DB(tasks+trash)를 **시점별 JSON 스냅샷**으로 보관(버전 유지).
  단순 미러가 아니라 스냅샷이라 본 DB가 비어도 과거 백업이 살아 있다.
- **자동 백업**: Windows 작업 스케줄러 `TodoApp_DB_Backup_12h`가 **12시간마다** [scripts/backup.cmd](scripts/backup.cmd) → [scripts/backup.mjs](scripts/backup.mjs) 실행. (본 DB가 비어 있으면 자동 백업은 건너뜀)
- **스크립트**:
  - 수동 백업: `node scripts/backup.mjs manual`
  - 스냅샷 목록: `node scripts/restore.mjs --list`
  - 복구: `node scripts/restore.mjs [<id>|생략=최신]` — 본 DB를 스냅샷으로 교체(파괴적). **복원 직전 현재 상태를 `pre-restore` 스냅샷으로 자동 백업**하므로 되돌릴 수 있다.
- **사용자 명령 해석**(중요): "백업해줘" = **수동 백업 스냅샷 생성**(안전). 복구는 "복구/되돌려" 같은 명시적 표현일 때만, 그리고 파괴적이므로 실행 전 확인.
- 백업/복구 스크립트는 본 DB를 **삭제하지 않는다**(restore의 교체만 예외이며 사용자 요청 시).

## 작업 규칙

- **idea/function 기록**: 사용자가 새 아이디어나 기능을 설명하면
  `DOCUMENT/idea.md`(아이디어)와 `DOCUMENT/function.md`(기능 명세)에 기록한다. 없으면 생성.
- `REFERENCE/index.html`은 이식 기준 원본이므로 수정하지 않는다.
- 디자인은 참고 파일과 동일하게 유지한다 (CSS 그대로 이식).
- 명령형 DOM 로직을 건드릴 때는 위 "아키텍처" 제약(리스너 정리, StrictMode off)을 지킬 것.
- 모호하거나 확실하지 않은 결정은 진행 전에 사용자에게 물어본다.

## 환경

- Windows 11, PowerShell. Node 26, npm 11.
