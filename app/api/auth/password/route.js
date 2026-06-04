import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../../lib/db";
import { getAuth, verifyPw, hashPw } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await ensureSchema();
    const a = getAuth(req);
    if (!a) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    const b = await req.json();
    const cur = String(b?.currentPassword || "");
    const np = String(b?.newPassword || "");
    if (!cur || !np) return NextResponse.json({ error: "현재·새 비밀번호를 입력하세요" }, { status: 400 });
    if (np.length < 6) return NextResponse.json({ error: "새 비밀번호는 6자 이상이어야 해요" }, { status: 400 });

    const [rows] = await getPool().query("SELECT pw_hash FROM users WHERE id=?", [a.uid]);
    if (!rows.length) return NextResponse.json({ error: "사용자를 찾을 수 없어요" }, { status: 404 });
    const ok = await verifyPw(cur, rows[0].pw_hash);
    if (!ok) return NextResponse.json({ error: "현재 비밀번호가 올바르지 않아요" }, { status: 401 });

    const hash = await hashPw(np);
    await getPool().query("UPDATE users SET pw_hash=? WHERE id=?", [hash, a.uid]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("password change failed:", e);
    return NextResponse.json({ error: "변경 실패: " + e.message }, { status: 500 });
  }
}
