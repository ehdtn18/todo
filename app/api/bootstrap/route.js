import { NextResponse } from "next/server";
import { getPool, ensureSchema, rowToTask, rowToTrash, rowToLeave } from "../../../lib/db";
import { getAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/bootstrap -> 초기 로드에 필요한 모든 데이터를 한 번에(병렬 쿼리).
// 6개의 순차 요청을 1개로 합쳐 왕복 지연을 크게 줄인다.
export async function GET(req) {
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ user: null });
    await ensureSchema();
    const pool = getPool();
    const [me, tasks, trash, leaves, settingsRows, users] = await Promise.all([
      pool.query("SELECT id, email, name, team FROM users WHERE id=?", [a.uid]),
      pool.query("SELECT * FROM tasks WHERE owner=? ORDER BY sort_order ASC, created ASC", [a.uid]),
      pool.query("SELECT * FROM trash WHERE owner=? ORDER BY deleted_at DESC, sort_order ASC", [a.uid]),
      pool.query("SELECT * FROM leaves WHERE owner=? ORDER BY ldate ASC", [a.uid]),
      pool.query("SELECT data FROM settings WHERE owner=?", [a.uid]),
      pool.query("SELECT id, name, team, email FROM users ORDER BY team ASC, name ASC"),
    ]);
    const meRow = me[0][0];
    if (!meRow) return NextResponse.json({ user: null });
    let settings = {};
    if (settingsRows[0].length && settingsRows[0][0].data) {
      try { settings = typeof settingsRows[0][0].data === "string" ? JSON.parse(settingsRows[0][0].data) : settingsRows[0][0].data; } catch { settings = {}; }
    }
    return NextResponse.json({
      user: { id: meRow.id, email: meRow.email, name: meRow.name, team: meRow.team },
      tasks: tasks[0].map(rowToTask),
      trash: trash[0].map(rowToTrash),
      leaves: leaves[0].map(rowToLeave),
      settings: settings && typeof settings === "object" ? settings : {},
      users: users[0].map((u) => ({ id: u.id, name: u.name, team: u.team, email: u.email })),
    });
  } catch (e) {
    console.error("GET /api/bootstrap failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}
