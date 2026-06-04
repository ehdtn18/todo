// 인증 도입 마이그레이션 (TiDB):
//  - 강동수 계정 생성, 기존 데이터(owner NULL) → 강동수 귀속, 설정 변환
//  - 더미: 기획팀 다정·수민, 개발팀 재혁 (각 task 10개)  ※ QA 후 삭제 예정(scripts/delete-dummies.mjs)
// 실행(Git Bash): DB_* / DB_SSL=true 설정 후  node scripts/setup-auth.mjs
import { getPool, ensureSchema, migrateColumns, taskToValues, TASK_INSERT_COLS } from "../lib/db.js";
import { hashPw, uid } from "../lib/auth.js";

// 비밀번호는 코드에 두지 않고 실행 시 env 로 주입한다(공개 레포에 비밀번호를 커밋하지 않기 위함).
//   PRIMARY_PW=강동수비번 DUMMY_PW=더미공통비번 node scripts/setup-auth.mjs
const PRIMARY_PW = process.env.PRIMARY_PW;
const DUMMY_PW = process.env.DUMMY_PW || "test1234!";
if (!PRIMARY_PW) { console.error("PRIMARY_PW 환경변수가 필요해요 (강동수 계정 비밀번호)"); process.exit(1); }
const OWNER_PRIMARY = { email: "kds@careid.center", name: "강동수", first: "동수", team: "디자인팀", pw: PRIMARY_PW };
const DUMMIES = [
  { email: "dajeong@careid.center", name: "이다정", first: "다정", team: "기획팀", pw: DUMMY_PW },
  { email: "sumin@careid.center", name: "안수민", first: "수민", team: "기획팀", pw: DUMMY_PW },
  { email: "jaehyuk@careid.center", name: "최재혁", first: "재혁", team: "개발팀", pw: DUMMY_PW },
  { email: "yunji@careid.center", name: "남윤지", first: "윤지", team: "디자인팀", pw: DUMMY_PW },
];

const pad = (n) => String(n).padStart(2, "0");
const iso = (mo, d) => `2026-${pad(mo)}-${pad(d)}`;

async function upsertUser(pool, u) {
  const [ex] = await pool.query("SELECT id FROM users WHERE email=?", [u.email]);
  if (ex.length) return ex[0].id;
  const id = uid();
  const hash = await hashPw(u.pw);
  await pool.query("INSERT INTO users (id, email, pw_hash, name, first_name, team, created) VALUES (?,?,?,?,?,?,?)",
    [id, u.email, hash, u.name, u.first || u.name, u.team, Date.now()]);
  return id;
}

// 사람별 더미 task 생성기 (제목에 [기획]/[개발] 같은 접두어 쓰지 않는다)
function planningTasks(owner) {
  const T = [
    ["26FW 신제품 라인업 정리", "시즌 라인업 표 정리하고 MD팀과 공유", iso(6, 2), iso(6, 4), "high", true],
    ["사용자 인터뷰 5명 진행", "온보딩 플로우 관련 인터뷰", iso(6, 5), iso(6, 9), "high", false],
    ["경쟁사 벤치마킹 리포트", "주요 3사 기능 비교 정리", iso(6, 8), iso(6, 11), "mid", false],
    ["신규 알림 센터 PRD 작성", "알림 센터 개선 기획", iso(6, 10), iso(6, 12), "high", false],
    ["스프린트 회고 정리", "지난 스프린트 KPT", iso(6, 3), iso(6, 3), "low", true],
    ["데이터 대시보드 지표 정의", "핵심 지표 7개 합의", iso(6, 12), iso(6, 16), "mid", false],
    ["랜딩페이지 카피 초안", "히어로/특징 섹션 문구", iso(6, 15), iso(6, 17), "mid", false],
    ["회원가입 QA 시나리오 작성", "회원가입·로그인 플로우", iso(6, 16), iso(6, 18), "high", false],
    ["Q3 로드맵 초안", "분기 목표/마일스톤", iso(6, 18), iso(6, 22), "mid", false],
    ["고객 문의 유형 분석", "최근 한 달 문의 태깅", iso(6, 6), iso(6, 7), "low", true],
  ];
  return T;
}
function devTasks(owner) {
  const T = [
    ["로그인 API 구현", "토큰 쿠키 세션", iso(6, 2), iso(6, 5), "high", true],
    ["멀티테넌시 데이터 분리", "owner 컬럼 + 스코프", iso(6, 4), iso(6, 8), "high", false],
    ["알림 배치 잡 안정화", "중복 발송 버그 수정", iso(6, 6), iso(6, 9), "high", false],
    ["DB 인덱스 점검", "느린 쿼리 3개 개선", iso(6, 9), iso(6, 11), "mid", false],
    ["CI 파이프라인 정리", "테스트 캐시 적용", iso(6, 3), iso(6, 4), "low", true],
    ["파일 업로드 Blob 연동", "Vercel Blob", iso(6, 10), iso(6, 12), "mid", false],
    ["에러 모니터링 연동", "Sentry 셋업", iso(6, 12), iso(6, 15), "mid", false],
    ["반응형 레이아웃 QA", "모바일 깨짐 수정", iso(6, 15), iso(6, 17), "high", false],
    ["캘린더 렌더 최적화", "주간 뷰 리렌더", iso(6, 17), iso(6, 20), "mid", false],
    ["공통 유틸 리팩터", "코드 리뷰 반영", iso(6, 7), iso(6, 8), "low", true],
  ];
  return T;
}
function designTasks(owner) {
  const T = [
    ["신제품 상세페이지 디자인", "DDP 상세 레이아웃", iso(6, 3), iso(6, 6), "high", false],
    ["디자인 시스템 컬러 토큰 정리", "라이트/다크 토큰 통합", iso(6, 5), iso(6, 8), "mid", true],
    ["메인 배너 시안 3종", "프로모션 배너 A/B", iso(6, 8), iso(6, 10), "high", false],
    ["아이콘 세트 리뉴얼", "공통 아이콘 24px 정리", iso(6, 11), iso(6, 14), "mid", false],
    ["프로토타입 인터랙션 정리", "주요 플로우 모션 가이드", iso(6, 15), iso(6, 18), "low", false],
  ];
  return T;
}

function buildTasks(owner, defs) {
  const base = Date.UTC(2026, 5, 1);
  return defs.map((d, i) => ({
    id: uid(),
    title: d[0],
    body: d[1] || "",
    start: d[2],
    end: d[3],
    startTime: "09:00",
    endTime: "18:00",
    pri: d[4] || "mid",
    done: !!d[5],
    incHol: false,
    notify: true,
    notifyTime: "09:00",
    notifyLead: 10,
    created: base + i * 3600 * 1000,
    history: [],
    confirms: [],
  }));
}

(async () => {
  try {
    const pool = getPool();
    // 1) 기존 settings(단일행 id=1) 데이터 백업 후 owner기반으로 재생성
    let oldSettings = null;
    try { const [s] = await pool.query("SELECT data FROM settings LIMIT 1"); if (s.length) oldSettings = s[0].data; } catch {}
    try { await pool.query("DROP TABLE IF EXISTS settings"); } catch {}

    // 2) 스키마 보장(users/owner기반 settings) + 기존 테이블에 owner 컬럼 추가
    await ensureSchema();
    await migrateColumns();

    // 3) 강동수 계정
    const primaryId = await upsertUser(pool, OWNER_PRIMARY);

    // 4) 기존 데이터(owner NULL) → 강동수 귀속
    const [r1] = await pool.query("UPDATE tasks SET owner=? WHERE owner IS NULL", [primaryId]);
    const [r2] = await pool.query("UPDATE trash SET owner=? WHERE owner IS NULL", [primaryId]);
    const [r3] = await pool.query("UPDATE leaves SET owner=? WHERE owner IS NULL", [primaryId]);

    // 5) 강동수 설정 복원
    if (oldSettings) {
      const dataStr = typeof oldSettings === "string" ? oldSettings : JSON.stringify(oldSettings);
      await pool.query("INSERT INTO settings (owner, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data=VALUES(data)", [primaryId, dataStr]);
    }

    // 6) 더미 유저 + task 10개씩 (재실행 대비: 더미 task 먼저 비움)
    const dummyInfo = [];
    for (const d of DUMMIES) {
      const id = await upsertUser(pool, d);
      const defs = d.team === "개발팀" ? devTasks(id) : d.team === "디자인팀" ? designTasks(id) : planningTasks(id);
      const tasks = buildTasks(id, defs);
      await pool.query("DELETE FROM tasks WHERE owner=?", [id]);
      const values = tasks.map((t, i) => taskToValues(t, i, id));
      await pool.query(`INSERT INTO tasks (${TASK_INSERT_COLS}) VALUES ?`, [values]);
      dummyInfo.push(`${d.name}(${d.team}) ${tasks.length}개`);
    }

    // 검증
    const [[tc]] = await pool.query("SELECT COUNT(*) n FROM tasks");
    const [[uc]] = await pool.query("SELECT COUNT(*) n FROM users");
    const [[pc]] = await pool.query("SELECT COUNT(*) n FROM tasks WHERE owner=?", [primaryId]);
    console.log("✅ 인증 마이그레이션 완료");
    console.log("   강동수 id:", primaryId, "| 귀속 tasks:", pc.n, "(trash", r2.affectedRows, "/ leaves", r3.affectedRows, ")");
    console.log("   더미:", dummyInfo.join(", "));
    console.log("   전체 users:", uc.n, "| 전체 tasks:", tc.n);
    process.exit(0);
  } catch (e) {
    console.error("❌ 실패:", e.code || "", e.message);
    process.exit(1);
  }
})();
