import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../../lib/db";
import { hashPw, makeToken, AUTH_COOKIE, cookieOpts, uid, TEAMS } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await ensureSchema();
    const b = await req.json();
    const email = String(b?.email || "").trim().toLowerCase();
    const password = String(b?.password || "");
    const name = String(b?.name || "").trim();
    const team = String(b?.team || "").trim();
    if (!email || !password || !name || !team) return NextResponse.json({ error: "모든 항목을 입력하세요" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "이메일 형식이 올바르지 않아요" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "비밀번호는 6자 이상이어야 해요" }, { status: 400 });
    if (TEAMS.indexOf(team) < 0) return NextResponse.json({ error: "팀을 선택하세요" }, { status: 400 });

    const pool = getPool();
    const [ex] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
    if (ex.length) return NextResponse.json({ error: "이미 가입된 이메일이에요" }, { status: 409 });

    const id = uid();
    const hash = await hashPw(password);
    await pool.query("INSERT INTO users (id, email, pw_hash, name, team, created) VALUES (?,?,?,?,?,?)",
      [id, email, hash, name, team, Date.now()]);

    const user = { id, email, name, team };
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(AUTH_COOKIE, makeToken(user), cookieOpts());
    return res;
  } catch (e) {
    console.error("register failed:", e);
    return NextResponse.json({ error: "회원가입 실패: " + e.message }, { status: 500 });
  }
}
