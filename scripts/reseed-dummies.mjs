// QA 더미 task 재시드(제목 정리·[기획]/[개발] 접두 제거) + 디자인팀 윤지 추가(task 5개).
// ⚠️ 더미 계정(다정·수민·재혁·윤지)의 tasks 만 교체한다. 강동수·settings·trash·leaves 는 건드리지 않는다.
// 실행(Git Bash): DB_* / DB_SSL=true [DUMMY_PW=test1234!] 설정 후  node scripts/reseed-dummies.mjs
import { getPool, ensureSchema, taskToValues, TASK_INSERT_COLS } from "../lib/db.js";
import { hashPw, uid } from "../lib/auth.js";

const DUMMY_PW = process.env.DUMMY_PW || "test1234!";

// 사람/팀별 더미 task 제목 (접두어 없이 자연스럽게)
const PLANNING = [
  ["26FW 신제품 라인업 정리", "시즌 라인업 표 정리하고 MD팀과 공유", 2, 4, "high", true],
  ["사용자 인터뷰 5명 진행", "온보딩 플로우 관련 인터뷰", 5, 9, "high", false],
  ["경쟁사 벤치마킹 리포트", "주요 3사 기능 비교 정리", 8, 11, "mid", false],
  ["신규 알림 센터 PRD 작성", "알림 센터 개선 기획", 10, 12, "high", false],
  ["스프린트 회고 정리", "지난 스프린트 KPT", 3, 3, "low", true],
  ["데이터 대시보드 지표 정의", "핵심 지표 7개 합의", 12, 16, "mid", false],
  ["랜딩페이지 카피 초안", "히어로/특징 섹션 문구", 15, 17, "mid", false],
  ["회원가입 QA 시나리오 작성", "회원가입·로그인 플로우", 16, 18, "high", false],
  ["Q3 로드맵 초안", "분기 목표/마일스톤", 18, 22, "mid", false],
  ["고객 문의 유형 분석", "최근 한 달 문의 태깅", 6, 7, "low", true],
];
const DEV = [
  ["로그인 API 구현", "토큰 쿠키 세션", 2, 5, "high", true],
  ["멀티테넌시 데이터 분리", "owner 컬럼 + 스코프", 4, 8, "high", false],
  ["알림 배치 잡 안정화", "중복 발송 버그 수정", 6, 9, "high", false],
  ["DB 인덱스 점검", "느린 쿼리 3개 개선", 9, 11, "mid", false],
  ["CI 파이프라인 정리", "테스트 캐시 적용", 3, 4, "low", true],
  ["파일 업로드 Blob 연동", "Vercel Blob", 10, 12, "mid", false],
  ["에러 모니터링 연동", "Sentry 셋업", 12, 15, "mid", false],
  ["반응형 레이아웃 QA", "모바일 깨짐 수정", 15, 17, "high", false],
  ["캘린더 렌더 최적화", "주간 뷰 리렌더", 17, 20, "mid", false],
  ["공통 유틸 리팩터", "코드 리뷰 반영", 7, 8, "low", true],
];
const DESIGN = [
  ["신제품 상세페이지 디자인", "DDP 상세 레이아웃", 3, 6, "high", false],
  ["디자인 시스템 컬러 토큰 정리", "라이트/다크 토큰 통합", 5, 8, "mid", true],
  ["메인 배너 시안 3종", "프로모션 배너 A/B", 8, 10, "high", false],
  ["아이콘 세트 리뉴얼", "공통 아이콘 24px 정리", 11, 14, "mid", false],
  ["프로토타입 인터랙션 정리", "주요 플로우 모션 가이드", 15, 18, "low", false],
];

const DUMMIES = [
  { email: "dajeong@careid.center", name: "다정", team: "기획팀", defs: PLANNING },
  { email: "sumin@careid.center", name: "수민", team: "기획팀", defs: PLANNING },
  { email: "jaehyuk@careid.center", name: "재혁", team: "개발팀", defs: DEV },
  { email: "yunji@careid.center", name: "윤지", team: "디자인팀", defs: DESIGN },
];

const pad = (n) => String(n).padStart(2, "0");
const iso = (mo, d) => `2026-${pad(mo)}-${pad(d)}`;

function buildTasks(defs) {
  const base = Date.UTC(2026, 5, 1);
  return defs.map((d, i) => ({
    id: uid(), title: d[0], body: d[1] || "",
    start: iso(6, d[2]), end: iso(6, d[3]),
    startTime: "09:00", endTime: "18:00",
    pri: d[4] || "mid", done: !!d[5],
    incHol: false, notify: true, notifyTime: "09:00", notifyLead: 10,
    created: base + i * 3600 * 1000, history: [], confirms: [],
  }));
}

async function upsertUser(pool, u) {
  const [ex] = await pool.query("SELECT id FROM users WHERE email=?", [u.email]);
  if (ex.length) return ex[0].id;
  const id = uid();
  const hash = await hashPw(DUMMY_PW);
  await pool.query("INSERT INTO users (id, email, pw_hash, name, team, created) VALUES (?,?,?,?,?,?)",
    [id, u.email, hash, u.name, u.team, Date.now()]);
  return id;
}

(async () => {
  try {
    const pool = getPool();
    await ensureSchema();
    const info = [];
    for (const d of DUMMIES) {
      const id = await upsertUser(pool, d);
      const tasks = buildTasks(d.defs);
      await pool.query("DELETE FROM tasks WHERE owner=?", [id]); // 더미 본인 task 만 교체
      const values = tasks.map((t, i) => taskToValues(t, i, id));
      await pool.query(`INSERT INTO tasks (${TASK_INSERT_COLS}) VALUES ?`, [values]);
      info.push(`${d.name}(${d.team}) ${tasks.length}개`);
    }
    console.log("✅ 더미 재시드 완료:", info.join(", "));
    process.exit(0);
  } catch (e) {
    console.error("❌ 실패:", e.code || "", e.message);
    process.exit(1);
  }
})();
