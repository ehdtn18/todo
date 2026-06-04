import { NextResponse } from "next/server";
import { getPool, ensureSchema, rowToTrash, taskToValues, TASK_INSERT_COLS } from "../../../lib/db";

export const dynamic = "force-dynamic";

// GET /api/trash  ->  휴지통 배열 (최근 삭제 순)
export async function GET() {
  try {
    await ensureSchema();
    const [rows] = await getPool().query(
      "SELECT * FROM trash ORDER BY deleted_at DESC, sort_order ASC"
    );
    return NextResponse.json(rows.map(rowToTrash));
  } catch (e) {
    console.error("GET /api/trash failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}

// POST /api/trash  ->  전달된 배열로 trash 테이블 전체 교체 (벌크 저장)
export async function POST(req) {
  let conn;
  try {
    await ensureSchema();
    const body = await req.json();
    const items = Array.isArray(body) ? body : Array.isArray(body?.trash) ? body.trash : [];

    conn = await getPool().getConnection();
    await conn.beginTransaction();
    await conn.query("DELETE FROM trash");
    if (items.length) {
      // tasks 컬럼 + deleted_at
      const values = items.map((t, i) => [...taskToValues(t, i), Number(t.deletedAt) || 0]);
      await conn.query(
        `INSERT INTO trash (${TASK_INSERT_COLS}, deleted_at) VALUES ?`,
        [values]
      );
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
