// 로컬 MySQL → TiDB(또는 클라우드) 데이터 이전: tasks / trash / leaves / settings
// - 원본(로컬)은 SELECT 만(읽기 전용, 변경 없음)
// - 대상(TiDB)은 테이블 자동 생성 후 PK 기준 upsert(중복 안 생김, 재실행 안전)
// 사용(Git Bash) — 대상은 DB_* , 원본은 SRC_* 로 지정:
//   DB_HOST=... DB_PORT=4000 DB_USER=...root DB_PASSWORD='비번' DB_NAME=todo DB_SSL=true \
//   SRC_HOST=localhost SRC_PORT=3306 SRC_USER=root SRC_PASSWORD=1234 SRC_DB=todo \
//   node scripts/migrate-to-tidb.mjs
import mysql from "mysql2/promise";
import { getPool, ensureSchema } from "../lib/db.js";

const SRC = {
  host: process.env.SRC_HOST || "localhost",
  port: Number(process.env.SRC_PORT || 3306),
  user: process.env.SRC_USER || "root",
  password: process.env.SRC_PASSWORD || "1234",
  database: process.env.SRC_DB || "todo",
};

const TABLES = ["tasks", "trash", "leaves", "settings"];

function coerce(v) {
  if (v === null || v === undefined) return v;
  if (Buffer.isBuffer(v) || v instanceof Date) return v;
  if (typeof v === "object") return JSON.stringify(v); // JSON 컬럼(history/confirms/data)
  return v;
}

let src;
try {
  src = await mysql.createConnection(SRC);
  await ensureSchema(); // 대상(TiDB)에 테이블 생성/마이그레이션
  const dst = getPool();

  const summary = [];
  for (const t of TABLES) {
    let rows;
    try { [rows] = await src.query("SELECT * FROM `" + t + "`"); }
    catch (e) { summary.push(t + ": 원본에 테이블 없음(건너뜀)"); continue; }
    if (!rows.length) { summary.push(t + ": 0행"); continue; }
    const cols = Object.keys(rows[0]);
    const values = rows.map((r) => cols.map((c) => coerce(r[c])));
    const colList = cols.map((c) => "`" + c + "`").join(",");
    const updates = cols.map((c) => "`" + c + "`=VALUES(`" + c + "`)").join(",");
    await dst.query(
      "INSERT INTO `" + t + "` (" + colList + ") VALUES ? ON DUPLICATE KEY UPDATE " + updates,
      [values]
    );
    summary.push(t + ": " + rows.length + "행 이전");
  }

  console.log("✅ 마이그레이션 완료 (로컬 → TiDB)");
  summary.forEach((s) => console.log("   - " + s));
  const [[a]] = await dst.query("SELECT COUNT(*) n FROM tasks");
  const [[b]] = await dst.query("SELECT COUNT(*) n FROM trash");
  const [[c]] = await dst.query("SELECT COUNT(*) n FROM leaves");
  console.log("   TiDB 현재 행수 → tasks:" + a.n + " trash:" + b.n + " leaves:" + c.n);
  await src.end();
  process.exit(0);
} catch (e) {
  console.error("❌ 마이그레이션 실패:", e.code || "", e.message);
  if (src) { try { await src.end(); } catch {} }
  process.exit(1);
}
