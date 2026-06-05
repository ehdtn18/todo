import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../../lib/db";
import { maskFive } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST {email, lastName, firstName} -> { masked } : 이메일+성이름이 모두 맞아야 비밀번호 일부를 보여준다.
export async function POST(req) {
  try {
    await ensureSchema();
    const b = await req.json();
    const email = String(b?.email || "").trim().toLowerCase();
    const full = (String(b?.lastName || "").trim() + String(b?.firstName || "").trim());
    if (!email || !full) return NextResponse.json({ error: "이메일과 성·이름을 입력하세요" }, { status: 400 });
    const [rows] = await getPool().query("SELECT pw_plain, name FROM users WHERE email=?", [email]);
    if (!rows.length || rows[0].name !== full) return NextResponse.json({ error: "이메일 또는 성·이름이 일치하지 않아요" }, { status: 404 });
    const pw = rows[0].pw_plain;
    if (!pw) return NextResponse.json({ error: "이 계정은 비밀번호를 표시할 수 없어요(비밀번호 변경 후 이용)" }, { status: 422 });
    return NextResponse.json({ masked: maskFive(pw) });
  } catch (e) {
    console.error("find-pw failed:", e);
    return NextResponse.json({ error: "조회 실패: " + e.message }, { status: 500 });
  }
}
