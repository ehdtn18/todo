import { NextResponse } from "next/server";
import { getPool, ensureSchema, rowToTask, taskToValues, TASK_INSERT_COLS } from "../../../lib/db";

export const dynamic = "force-dynamic";

// GET /api/tasks  ->  전체 할 일 배열
export async function GET() {
  try {
    await ensureSchema();
    const [rows] = await getPool().query(
      "SELECT * FROM tasks ORDER BY sort_order ASC, created ASC"
    );
    return NextResponse.json(rows.map(rowToTask));
  } catch (e) {
    console.error("GET /api/tasks failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}

// POST /api/tasks  ->  전달된 배열로 tasks 테이블 전체 교체 (벌크 저장)
export async function POST(req) {
  let conn;
  try {
    await ensureSchema();
    const body = await req.json();
    const tasks = Array.isArray(body) ? body : Array.isArray(body?.tasks) ? body.tasks : [];

    conn = await getPool().getConnection();
    await conn.beginTransaction();
    await conn.query("DELETE FROM tasks");
    if (tasks.length) {
      const values = tasks.map((t, i) => taskToValues(t, i));
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
