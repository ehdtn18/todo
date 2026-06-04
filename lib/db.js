import mysql from "mysql2/promise";

// 로컬 전용 MySQL 커넥션 풀.
// .env.local 의 DB_* 값을 사용한다.
// 중요: Next.js dev 의 핫리로드는 이 모듈을 재평가하므로 `let pool`만 쓰면
// 리로드마다 새 풀이 생기고 옛 풀의 연결이 닫히지 않아 누적된다("Too many connections").
// 풀을 globalThis 에 캐싱해 리로드 사이에도 단일 풀을 재사용한다.
export function getPool() {
  if (!globalThis.__todoPool) {
    // 클라우드 MySQL(Vercel 배포 등)은 보통 SSL 연결을 요구한다.
    // DB_SSL=true 면 TLS 사용. 자체서명 CA를 주는 호스트는 DB_SSL_REJECT_UNAUTHORIZED=false.
    const sslOn = /^(1|true|require|required)$/i.test(String(process.env.DB_SSL || ""));
    const ssl = sslOn
      ? { rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false" }
      : undefined;
    globalThis.__todoPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "todo",
      ssl,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }
  return globalThis.__todoPool;
}

// tasks/trash 공통 컬럼 정의 (trash 는 deleted_at 추가)
const TASK_COLS = `
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  title       TEXT         NOT NULL,
  body        MEDIUMTEXT,
  start_date  VARCHAR(10),
  end_date    VARCHAR(10),
  start_time  VARCHAR(5),
  end_time    VARCHAR(5),
  pri         VARCHAR(8)   NOT NULL DEFAULT 'mid',
  done        TINYINT(1)   NOT NULL DEFAULT 0,
  inc_hol     TINYINT(1)   NOT NULL DEFAULT 0,
  notify      TINYINT(1)   NOT NULL DEFAULT 1,
  notify_lead INT          NOT NULL DEFAULT 10,
  notify_time VARCHAR(5)   NOT NULL DEFAULT '09:00',
  created     BIGINT       NOT NULL,
  history     JSON,
  sort_order  INT          NOT NULL DEFAULT 0,
  confirms    JSON
`;

let ensured = false;

// 테이블이 없으면 생성한다. (최초 API 호출 시 1회)
// 기존 tasks 테이블에 시간 컬럼이 없으면 추가(마이그레이션)한다.
export async function ensureSchema() {
  if (ensured) return;
  const pool = getPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (${TASK_COLS}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await pool.query(
    `CREATE TABLE IF NOT EXISTS trash (${TASK_COLS}, deleted_at BIGINT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
  // 연차(annual leave): 하루(ldate)당 사용 시간(hours: 2/4/6/8)
  await pool.query(`CREATE TABLE IF NOT EXISTS leaves (
    id      VARCHAR(32) NOT NULL PRIMARY KEY,
    ldate   VARCHAR(10) NOT NULL,
    hours   INT         NOT NULL DEFAULT 8,
    created BIGINT      NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  // 레이아웃/뷰 설정(정렬·우선순위 보기·완료 보기·달력 모드 등) — 단일 행(id=1) JSON 저장
  await pool.query(`CREATE TABLE IF NOT EXISTS settings (
    id   INT  NOT NULL PRIMARY KEY,
    data JSON
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  // 구버전 tasks 테이블 마이그레이션 (MySQL은 ADD COLUMN IF NOT EXISTS 미지원 → try/catch)
  for (const col of ["start_time VARCHAR(5)", "end_time VARCHAR(5)", "inc_hol TINYINT(1) NOT NULL DEFAULT 0", "notify TINYINT(1) NOT NULL DEFAULT 1", "notify_lead INT NOT NULL DEFAULT 10", "notify_time VARCHAR(5) NOT NULL DEFAULT '09:00'", "confirms JSON"]) {
    try { await pool.query(`ALTER TABLE tasks ADD COLUMN ${col}`); } catch {}
    try { await pool.query(`ALTER TABLE trash ADD COLUMN ${col}`); } catch {}
  }
  ensured = true;
}

// DB 행 -> 프론트엔드 task 객체
export function rowToTask(r) {
  let history = [];
  if (r.history) {
    try {
      history = typeof r.history === "string" ? JSON.parse(r.history) : r.history;
    } catch {
      history = [];
    }
  }
  return {
    id: r.id,
    title: r.title || "",
    body: r.body || "",
    start: r.start_date || null,
    end: r.end_date || null,
    startTime: r.start_time || "09:00",
    endTime: r.end_time || "18:00",
    pri: r.pri || "mid",
    done: !!r.done,
    incHol: !!r.inc_hol,
    notify: r.notify == null ? true : !!r.notify,
    notifyLead: r.notify_lead == null ? 10 : Number(r.notify_lead),
    notifyTime: r.notify_time || "09:00",
    created: Number(r.created) || 0,
    history: Array.isArray(history) ? history : [],
    confirms: parseJsonArr(r.confirms),
  };
}

function parseJsonArr(v) {
  if (!v) return [];
  try { const x = typeof v === "string" ? JSON.parse(v) : v; return Array.isArray(x) ? x : []; } catch { return []; }
}

export function rowToTrash(r) {
  return { ...rowToTask(r), deletedAt: Number(r.deleted_at) || 0 };
}

export function rowToLeave(r) {
  return { id: r.id, date: r.ldate, hours: Number(r.hours) || 0, created: Number(r.created) || 0 };
}

// task 객체 -> INSERT 용 값 배열 (tasks)
export function taskToValues(t, i) {
  return [
    String(t.id),
    t.title || "",
    t.body || "",
    t.start || null,
    t.end || null,
    t.startTime || "09:00",
    t.endTime || "18:00",
    t.pri || "mid",
    t.done ? 1 : 0,
    t.incHol ? 1 : 0,
    t.notify === false ? 0 : 1,
    Number.isFinite(Number(t.notifyLead)) ? Number(t.notifyLead) : 10,
    t.notifyTime || "09:00",
    Number(t.created) || Date.now(),
    JSON.stringify(Array.isArray(t.history) ? t.history : []),
    i,
    JSON.stringify(Array.isArray(t.confirms) ? t.confirms : []),
  ];
}

export const TASK_INSERT_COLS =
  "id, title, body, start_date, end_date, start_time, end_time, pri, done, inc_hol, notify, notify_lead, notify_time, created, history, sort_order, confirms";
