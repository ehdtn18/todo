import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../../lib/db";
import { maskEmail } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST {lastName, firstName} -> { emails: [마스킹된 이메일...] }
export async function POST(req) {
  try {
    await ensureSchema();
    const b = await req.json();
    const lastName = String(b?.lastName || "").trim();
    const firstName = String(b?.firstName || "").trim();
    if (!lastName || !firstName) return NextResponse.json({ error: "성과 이름을 입력하세요" }, { status: 400 });
    const full = lastName + firstName;
    const [rows] = await getPool().query("SELECT email FROM users WHERE name=? ORDER BY created ASC", [full]);
    const emails = rows.map((r) => maskEmail(r.email));
    return NextResponse.json({ emails });
  } catch (e) {
    console.error("find-id failed:", e);
    return NextResponse.json({ error: "조회 실패: " + e.message }, { status: 500 });
  }
}
