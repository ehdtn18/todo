// 백업 DB(todo_backup)의 스냅샷으로 본 DB(todo)를 복원한다.
// ⚠️ 본 DB의 tasks/trash를 스냅샷 내용으로 "교체"하므로 파괴적이다.
//    → 사용자가 명시적으로 요청할 때만 실행한다.
//    → 안전장치: 복원 직전 현재 상태를 자동 스냅샷(kind='pre-restore')으로 백업한다.
// 사용:
//   node scripts/restore.mjs            (가장 최근 스냅샷으로 복원)
//   node scripts/restore.mjs <id>       (특정 스냅샷 id로 복원)
//   node scripts/restore.mjs --list     (스냅샷 목록 보기, 복원 안 함)
import mysql from "mysql2/promise";

const DB = { host: "localhost", port: 3306, user: "root", password: "1234" };
const arg = process.argv[2];

const TASK_COLS = ["id","title","body","start_date","end_date","start_time","end_time","pri","done","inc_hol","notify","notify_lead","notify_time","created","history","sort_order"];
const TRASH_COLS = [...TASK_COLS, "deleted_at"];

function vals(row, cols) {
  return cols.map((k) => {
    const v = row[k];
    if (v === undefined) return null;
    if (v !== null && typeof v === "object") return JSON.stringify(v); // JSON 컬럼
    return v;
  });
}

const c = await mysql.createConnection({ ...DB, charset: "utf8mb4" });
try {
  const [snaps] = await c.query("SELECT id, created_at, kind, task_count, trash_count FROM todo_backup.snapshots ORDER BY id DESC");
  if (!snaps.length) { console.log("[restore] 스냅샷이 없습니다."); await c.end(); process.exit(1); }

  if (arg === "--list") {
    console.log("[restore] 스냅샷 목록 (최신순):");
    for (const s of snaps) console.log(`  #${s.id}  ${new Date(Number(s.created_at)).toLocaleString()}  tasks=${s.task_count} trash=${s.trash_count} (${s.kind})`);
    await c.end();
    process.exit(0);
  }

  const target = arg ? snaps.find((s) => String(s.id) === String(arg)) : snaps[0];
  if (!target) { console.log("[restore] 해당 스냅샷을 찾을 수 없습니다:", arg); await c.end(); process.exit(1); }

  // 1) 안전장치: 복원 직전 현재 상태 백업
  const [curTasks] = await c.query("SELECT * FROM todo.tasks ORDER BY sort_order, created");
  let curTrash = [];
  try { const [tr] = await c.query("SELECT * FROM todo.trash ORDER BY deleted_at DESC"); curTrash = tr; } catch {}
  let curLeaves = [];
  try { const [lv] = await c.query("SELECT * FROM todo.leaves ORDER BY ldate"); curLeaves = lv; } catch {}
  try { await c.query("ALTER TABLE todo_backup.snapshots ADD COLUMN leaves JSON"); } catch {}
  await c.query(
    "INSERT INTO todo_backup.snapshots (created_at, kind, task_count, trash_count, tasks, trash, leaves) VALUES (?,?,?,?,?,?,?)",
    [Date.now(), "pre-restore", curTasks.length, curTrash.length, JSON.stringify(curTasks), JSON.stringify(curTrash), JSON.stringify(curLeaves)]
  );

  // 2) 스냅샷 내용 로드
  const [[snap]] = await c.query("SELECT tasks, trash, leaves FROM todo_backup.snapshots WHERE id=?", [target.id]);
  const tasks = typeof snap.tasks === "string" ? JSON.parse(snap.tasks || "[]") : (snap.tasks || []);
  const trash = typeof snap.trash === "string" ? JSON.parse(snap.trash || "[]") : (snap.trash || []);
  const leaves = snap.leaves == null ? [] : (typeof snap.leaves === "string" ? JSON.parse(snap.leaves || "[]") : snap.leaves);

  // 3) 본 DB 교체 (트랜잭션)
  await c.query("START TRANSACTION");
  await c.query("DELETE FROM todo.tasks");
  if (tasks.length) {
    await c.query(`INSERT INTO todo.tasks (${TASK_COLS.join(",")}) VALUES ?`, [tasks.map((r) => vals(r, TASK_COLS))]);
  }
  try {
    await c.query("DELETE FROM todo.trash");
    if (trash.length) {
      await c.query(`INSERT INTO todo.trash (${TRASH_COLS.join(",")}) VALUES ?`, [trash.map((r) => vals(r, TRASH_COLS))]);
    }
  } catch {}
  try {
    await c.query("DELETE FROM todo.leaves");
    if (leaves.length) {
      const LCOLS = ["id", "ldate", "hours", "created"];
      await c.query(`INSERT INTO todo.leaves (${LCOLS.join(",")}) VALUES ?`, [leaves.map((r) => vals(r, LCOLS))]);
    }
  } catch {}
  await c.query("COMMIT");

  console.log(`[restore] 스냅샷 #${target.id} 로 복원 완료 — tasks ${tasks.length}, trash ${trash.length}, leaves ${leaves.length}. (복원 전 상태는 pre-restore 스냅샷으로 보관됨)`);
} catch (e) {
  try { await c.query("ROLLBACK"); } catch {}
  console.error("[restore] 실패:", e.message);
  process.exit(1);
} finally {
  await c.end();
}
