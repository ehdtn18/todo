import { NextResponse } from "next/server";
import { getPool, ensureSchema, rowToLeave } from "../../../lib/db";

export const dynamic = "force-dynamic";

// GET /api/leaves  ->  연차 배열 (날짜순)
export async function GET() {
  try {
    await ensureSchema();
    const [rows] = await getPool().query("SELECT * FROM leaves ORDER BY ldate ASC");
    return NextResponse.json(rows.map(rowToLeave));
  } catch (e) {
    console.error("GET /api/leaves failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}

// POST /api/leaves  ->  전달된 배열로 leaves 테이블 전체 교체 (벌크 저장)
export async function POST(req) {
  let conn;
  try {
    await ensureSchema();
    const body = await req.json();
    const items = Array.isArray(body) ? body : Array.isArray(body?.leaves) ? body.leaves : [];

    conn = await getPool().getConnection();
    await conn.beginTransaction();
    await conn.query("DELETE FROM leaves");
    if (items.length) {
      const values = items.map((l) => [
        String(l.id),
        l.date || null,
        Number(l.hours) || 0,
        Number(l.created) || Date.now(),
      ]);
      await conn.query("INSERT INTO leaves (id, ldate, hours, created) VALUES ?", [values]);
    }
    await conn.commit();
    return NextResponse.json({ ok: true, count: items.length });
  } catch (e) {
    if (conn) { try { await conn.rollback(); } catch {} }
    console.error("POST /api/leaves failed:", e);
    return NextResponse.json({ error: "DB 저장 실패: " + e.message }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
