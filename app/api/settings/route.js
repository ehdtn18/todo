import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

// GET /api/settings  ->  레이아웃/뷰 설정 객체 (없으면 {})
export async function GET() {
  try {
    await ensureSchema();
    const [rows] = await getPool().query("SELECT data FROM settings WHERE id=1");
    let data = {};
    if (rows.length && rows[0].data) {
      data = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
    }
    return NextResponse.json(data && typeof data === "object" ? data : {});
  } catch (e) {
    console.error("GET /api/settings failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}

// POST /api/settings  ->  설정 객체를 단일 행(id=1)에 upsert
export async function POST(req) {
  try {
    await ensureSchema();
    const body = await req.json();
    const data = body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const json = JSON.stringify(data);
    await getPool().query(
      "INSERT INTO settings (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data=VALUES(data)",
      [json]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/settings failed:", e);
    return NextResponse.json({ error: "DB 저장 실패: " + e.message }, { status: 500 });
  }
}
