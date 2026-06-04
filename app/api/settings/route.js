import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../lib/db";
import { getAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/settings  ->  내 레이아웃/뷰 설정 (없으면 {})
export async function GET(req) {
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({});
    await ensureSchema();
    const [rows] = await getPool().query("SELECT data FROM settings WHERE owner=?", [a.uid]);
    let data = {};
    if (rows.length && rows[0].data) {
      data = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
    }
    return NextResponse.json(data && typeof data === "object" ? data : {});
  } catch (e) {
    console.error("GET /api/settings failed:", e);
    return NextResponse.json({});
  }
}

// POST /api/settings  ->  내 설정 upsert (owner 기준)
export async function POST(req) {
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    await ensureSchema();
    const body = await req.json();
    const data = body && typeof body === "object" && !Array.isArray(body) ? body : {};
    await getPool().query(
      "INSERT INTO settings (owner, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data=VALUES(data)",
      [a.uid, JSON.stringify(data)]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/settings failed:", e);
    return NextResponse.json({ error: "DB 저장 실패: " + e.message }, { status: 500 });
  }
}
