import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../lib/db";
import { getAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/users -> 전체 유저 목록(필터용). 로그인 필요.
export async function GET(req) {
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    await ensureSchema();
    const [rows] = await getPool().query("SELECT id, name, first_name, team, email FROM users ORDER BY team ASC, name ASC");
    return NextResponse.json(rows.map((u) => ({ id: u.id, name: u.name, firstName: u.first_name || u.name, team: u.team, email: u.email })));
  } catch (e) {
    console.error("GET /api/users failed:", e);
    return NextResponse.json({ error: "DB 조회 실패: " + e.message }, { status: 500 });
  }
}
