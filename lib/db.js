import mysql from "mysql2/promise";

// 로컬/클라우드 MySQL 커넥션 풀. 핫리로드 누수 방지 위해 globalThis 캐싱.
export function getPool() {
  if (!globalThis.__todoPool) {
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

// tasks/trash 공통 컬럼 (trash 는 deleted_at 추가). owner = 소유 유저 id.
const TASK_COLS = `
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  owner       VARCHAR(32),
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
  confirms    JSON,
  INDEX idx_owner (owner)
`;

// 런타임 스키마 보장: CREATE TABLE IF NOT EXISTS 를 개별 쿼리로, 프로세스(콜드 람다)당 1회만.
// (TiDB 는 보안상 multi-statement 를 막아둬서 한 쿼리에 여러 문장을 넣을 수 없다)
// ALTER 마이그레이션은 런타임에서 하지 않는다(migrateColumns 는 setup 스크립트 전용).
const SCHEMA_STMTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id         VARCHAR(32)  NOT NULL PRIMARY KEY,
    email      VARCHAR(190) NOT NULL UNIQUE,
    pw_hash    VARCHAR(255) NOT NULL,
    name       VARCHAR(80)  NOT NULL,
    first_name VARCHAR(80),
    team       VARCHAR(40)  NOT NULL,
    pw_plain   VARCHAR(255),
    created    BIGINT       NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  `CREATE TABLE IF NOT EXISTS tasks (${TASK_COLS}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  `CREATE TABLE IF NOT EXISTS trash (${TASK_COLS}, deleted_at BIGINT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  `CREATE TABLE IF NOT EXISTS leaves (
    id      VARCHAR(32) NOT NULL PRIMARY KEY,
    owner   VARCHAR(32),
    ldate   VARCHAR(10) NOT NULL,
    hours   DECIMAL(4,1) NOT NULL DEFAULT 8,
    created BIGINT      NOT NULL,
    INDEX idx_owner (owner)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  `CREATE TABLE IF NOT EXISTS settings (
    owner VARCHAR(32) NOT NULL PRIMARY KEY,
    data  JSON
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
];

export async function ensureSchema() {
  if (globalThis.__schemaReady) return;
  const pool = getPool();
  for (const s of SCHEMA_STMTS) await pool.query(s);
  globalThis.__schemaReady = true;
}

// 구버전 테이블 컬럼/인덱스 추가 (setup 스크립트에서만 1회 호출). 런타임 핫패스에서는 호출하지 않는다.
export async function migrateColumns() {
  const pool = getPool();
  for (const col of ["start_time VARCHAR(5)", "end_time VARCHAR(5)", "inc_hol TINYINT(1) NOT NULL DEFAULT 0", "notify TINYINT(1) NOT NULL DEFAULT 1", "notify_lead INT NOT NULL DEFAULT 10", "notify_time VARCHAR(5) NOT NULL DEFAULT '09:00'", "confirms JSON", "owner VARCHAR(32)"]) {
    try { await pool.query(`ALTER TABLE tasks ADD COLUMN ${col}`); } catch {}
    try { await pool.query(`ALTER TABLE trash ADD COLUMN ${col}`); } catch {}
  }
  try { await pool.query(`ALTER TABLE users ADD COLUMN first_name VARCHAR(80)`); } catch {}
  try { await pool.query(`ALTER TABLE users ADD COLUMN pw_plain VARCHAR(255)`); } catch {}
  try { await pool.query(`ALTER TABLE leaves ADD COLUMN owner VARCHAR(32)`); } catch {}
  // 보상시간(음수)·30분 단위를 담기 위해 INT → DECIMAL(4,1)
  try { await pool.query(`ALTER TABLE leaves MODIFY hours DECIMAL(4,1) NOT NULL DEFAULT 8`); } catch {}
  try { await pool.query(`ALTER TABLE tasks ADD INDEX idx_owner (owner)`); } catch {}
  try { await pool.query(`ALTER TABLE trash ADD INDEX idx_owner (owner)`); } catch {}
  try { await pool.query(`ALTER TABLE leaves ADD INDEX idx_owner (owner)`); } catch {}
}

function parseJsonArr(v) {
  if (!v) return [];
  try { const x = typeof v === "string" ? JSON.parse(v) : v; return Array.isArray(x) ? x : []; } catch { return []; }
}

export function rowToTask(r) {
  let history = [];
  if (r.history) {
    try { history = typeof r.history === "string" ? JSON.parse(r.history) : r.history; } catch { history = []; }
  }
  return {
    id: r.id,
    owner: r.owner || null,
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

export function rowToTrash(r) {
  return { ...rowToTask(r), deletedAt: Number(r.deleted_at) || 0 };
}

export function rowToLeave(r) {
  return { id: r.id, date: r.ldate, hours: Number(r.hours) || 0, created: Number(r.created) || 0 };
}

export function rowToUser(r) {
  return { id: r.id, email: r.email, name: r.name, firstName: r.first_name || r.name || "", team: r.team, created: Number(r.created) || 0 };
}

// task 객체 -> INSERT 값 배열 (owner 포함)
export function taskToValues(t, i, owner) {
  return [
    String(t.id),
    owner || t.owner || null,
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
  "id, owner, title, body, start_date, end_date, start_time, end_time, pri, done, inc_hol, notify, notify_lead, notify_time, created, history, sort_order, confirms";
