import { NextResponse } from "next/server";
import { getPool, ensureSchema, rowToTask, taskToValues, TASK_INSERT_COLS } from "../../../lib/db";
import { getAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/tasks            -> 내 할 일
// GET /api/tasks?owner=<id> -> 특정 유저 할 일 (보기 전용 조회)
// GET /api/tasks?team=<팀>  -> 특정 팀 전체 할 일 (보기 전용 조회)
export async function GET(req) {
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    await ensureSchema();
    const url = new URL(req.url);
    const owner = url.searchParams.get("owner");
    const team = url.searchParams.get("team");
    const pool = getPool();
    let rows;
    if (team) {
      [rows] = await pool.query(
        "SELECT * FROM tasks WHERE owner IN (SELECT id FROM users WHERE team=?) ORDER BY sort_order ASC, created ASC",
        [team]
      );
    } else {
      [rows] = await pool.query(
        "SELECT * FROM tasks WHERE owner=? ORDER BY sort_order ASC, created ASC",
        [owner || a.uid]
      );
    }
    return NextResponse.json(rows.map(rowToTask));
  } catch (e) {
    console.error("GET /api/tasks failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}

// POST /api/tasks -> 내 할 일 전체 교체 (owner = 본인 고정)
export async function POST(req) {
  let conn;
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    await ensureSchema();
    const body = await req.json();
    const tasks = Array.isArray(body) ? body : Array.isArray(body?.tasks) ? body.tasks : [];

    conn = await getPool().getConnection();
    await conn.beginTransaction();
    await conn.query("DELETE FROM tasks WHERE owner=?", [a.uid]);
    if (tasks.length) {
      const values = tasks.map((t, i) => taskToValues(t, i, a.uid));
      await conn.query(`INSERT INTO tasks (${TASK_INSERT_COLS}) VALUES ?`, [values]);
    }
    await conn.commit();
    return NextResponse.json({ ok: true, count: tasks.length });
  } catch (e) {
    if (conn) { try { await conn.rollback(); } catch {} }
    console.error("POST /api/tasks failed:", e);
    return NextResponse.json({ error: "DB 저장 실패: " + e.message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
