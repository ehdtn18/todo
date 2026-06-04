import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../../lib/db";
import { getAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// 현재 로그인 유저. 쿠키가 유효하면 DB에서 최신 정보로 갱신해 반환.
export async function GET(req) {
  try {
    const a = getAuth(req);
    if (!a) return NextResponse.json({ user: null });
    await ensureSchema();
    const [rows] = await getPool().query("SELECT id, email, name, first_name, team FROM users WHERE id=?", [a.uid]);
    if (!rows.length) return NextResponse.json({ user: null });
    const u = rows[0];
    return NextResponse.json({ user: { id: u.id, email: u.email, name: u.name, firstName: u.first_name || u.name, team: u.team } });
  } catch (e) {
    console.error("me failed:", e);
    return NextResponse.json({ user: null });
  }
}
