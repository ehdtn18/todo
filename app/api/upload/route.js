import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// POST /api/upload  (multipart/form-data, field: "file")
// - Vercel 등 클라우드: BLOB_READ_WRITE_TOKEN 이 있으면 Vercel Blob 에 저장(파일시스템이 읽기전용이라 필요).
// - 로컬: public/uploads 에 저장하고 /uploads/xxx 경로 반환.
export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "파일이 없어요" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const orig = (file.name || "file").replace(/[^\w.\-가-힣]/g, "_");
    const name = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7) + "_" + orig;

    // 클라우드(Vercel Blob): 스토어를 연결하면 BLOB_READ_WRITE_TOKEN 이 자동 주입됨
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put("uploads/" + name, buf, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.type || undefined,
      });
      return NextResponse.json({ ok: true, url: blob.url, name: file.name || name });
    }

    // 로컬 파일시스템
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ ok: true, url: "/uploads/" + name, name: file.name || name });
  } catch (e) {
    console.error("POST /api/upload failed:", e);
    return NextResponse.json({ error: "업로드 실패: " + e.message }, { status: 500 });
  }
}
