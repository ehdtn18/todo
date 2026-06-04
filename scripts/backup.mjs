// 본 DB(todo)를 백업 DB(todo_backup)에 "시점별 스냅샷"으로 백업한다.
// - 비파괴적: 본 DB는 절대 건드리지 않고 읽기만 한다.
// - 버전 보관: 매 실행마다 snapshots 테이블에 한 행 추가(과거 백업 유지).
// 사용:
//   node scripts/backup.mjs          (자동 백업: 본 DB가 비어 있으면 건너뜀)
//   node scripts/backup.mjs manual   (수동 백업: 비어 있어도 기록)
import mysql from "mysql2/promise";

const DB = { host: "localhost", port: 3306, user: "root", password: "1234" };
const kind = process.argv[2] === "manual" ? "manual" : "auto";

const c = await mysql.createConnection({ ...DB, charset: "utf8mb4" });
try {
  await c.query("CREATE DATABASE IF NOT EXISTS todo_backup DEFAULT CHARSET=utf8mb4");
  await c.query(`CREATE TABLE IF NOT EXISTS todo_backup.snapshots (
    id          BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at  BIGINT      NOT NULL,
    kind        VARCHAR(16) NOT NULL DEFAULT 'auto',
    task_count  INT         NOT NULL DEFAULT 0,
    trash_count INT         NOT NULL DEFAULT 0,
    tasks       JSON,
    trash       JSON,
    leaves      JSON
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  try { await c.query("ALTER TABLE todo_backup.snapshots ADD COLUMN leaves JSON"); } catch {}

  const [tasks] = await c.query("SELECT * FROM todo.tasks ORDER BY sort_order, created");
  let trash = [];
  try { const [tr] = await c.query("SELECT * FROM todo.trash ORDER BY deleted_at DESC"); trash = tr; } catch {}
  let leaves = [];
  try { const [lv] = await c.query("SELECT * FROM todo.leaves ORDER BY ldate"); leaves = lv; } catch {}

  if (kind === "auto" && tasks.length === 0 && trash.length === 0 && leaves.length === 0) {
    console.log("[backup] 본 DB가 비어 있어 자동 백업을 건너뜀");
    await c.end();
    process.exit(0);
  }

  const now = Date.now();
  await c.query(
    "INSERT INTO todo_backup.snapshots (created_at, kind, task_count, trash_count, tasks, trash, leaves) VALUES (?,?,?,?,?,?,?)",
    [now, kind, tasks.length, trash.length, JSON.stringify(tasks), JSON.stringify(trash), JSON.stringify(leaves)]
  );
  const [[cnt]] = await c.query("SELECT COUNT(*) n FROM todo_backup.snapshots");
  console.log(`[backup] 스냅샷 저장 완료 — tasks ${tasks.length}, trash ${trash.length} (${kind}). 보관된 스냅샷: ${cnt.n}개`);
} finally {
  await c.end();
}
