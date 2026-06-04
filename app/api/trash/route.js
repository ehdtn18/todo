import { NextResponse } from "next/server";
import { getPool, ensureSchema, rowToTrash, taskToValues, TASK_INSERT_COLS } from "../../../lib/db";
import { getAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/trash  ->  내 휴지통 (최근 삭제 순)
export async function GET(req) {
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    await ensureSchema();
    const [rows] = await getPool().query(
      "SELECT * FROM trash WHERE owner=? ORDER BY deleted_at DESC, sort_order ASC",
      [a.uid]
    );
    return NextResponse.json(rows.map(rowToTrash));
  } catch (e) {
    console.error("GET /api/trash failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}

// POST /api/trash  ->  내 휴지통 전체 교체 (owner = 본인 고정)
export async function POST(req) {
  let conn;
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    await ensureSchema();
    const body = await req.json();
    const items = Array.isArray(body) ? body : Array.isArray(body?.trash) ? body.trash : [];

    conn = await getPool().getConnection();
    await conn.beginTransaction();
    await conn.query("DELETE FROM trash WHERE owner=?", [a.uid]);
    if (items.length) {
      const values = items.map((t, i) => [...taskToValues(t, i, a.uid), Number(t.deletedAt) || 0]);
      await conn.query(`INSERT INTO trash (${TASK_INSERT_COLS}, deleted_at) VALUES ?`, [values]);
    }
    await conn.commit();
    return NextResponse.json({ ok: true, count: items.length });
  } catch (e) {
    if (conn) { try { await conn.rollback(); } catch {} }
    console.error("POST /api/trash failed:", e);
    return NextResponse.json({ error: "DB 저장 실패: " + e.message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
