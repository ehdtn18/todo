import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// POST /api/upload  (multipart/form-data, field: "file")
// public/uploads 에 저장하고 공개 경로(/uploads/xxx)를 반환한다. (로컬 전용)
export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "파일이 없어요" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });

    const orig = (file.name || "file").replace(/[^\w.\-가-힣]/g, "_");
    const ext = orig.includes(".") ? "" : "";
    // 충돌 방지용 접두사 (Date.now는 라우트에서 사용 가능)
    const name = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7) + "_" + orig + ext;
    await writeFile(path.join(dir, name), buf);

    return NextResponse.json({ ok: true, url: "/uploads/" + name, name: file.name || name });
  } catch (e) {
    console.error("POST /api/upload failed:", e);
    return NextResponse.json({ error: "업로드 실패: " + e.message }, { status: 500 });
  }
}
