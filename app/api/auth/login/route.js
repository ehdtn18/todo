import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../../lib/db";
import { verifyPw, makeToken, AUTH_COOKIE, cookieOpts } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await ensureSchema();
    const b = await req.json();
    const email = String(b?.email || "").trim().toLowerCase();
    const password = String(b?.password || "");
    if (!email || !password) return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요" }, { status: 400 });

    const [rows] = await getPool().query("SELECT * FROM users WHERE email=?", [email]);
    if (!rows.length) return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않아요" }, { status: 401 });
    const u = rows[0];
    const ok = await verifyPw(password, u.pw_hash);
    if (!ok) return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않아요" }, { status: 401 });

    const user = { id: u.id, email: u.email, name: u.name, team: u.team };
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(AUTH_COOKIE, makeToken(user), cookieOpts());
    return res;
  } catch (e) {
    console.error("login failed:", e);
    return NextResponse.json({ error: "로그인 실패: " + e.message }, { status: 500 });
  }
}
