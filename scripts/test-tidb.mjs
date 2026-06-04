// TiDB(또는 클라우드 MySQL) 연결 테스트 + DB 자동 생성
// 사용(Git Bash):
//   TIDB_HOST=... TIDB_PORT=4000 TIDB_USER=...root TIDB_PASSWORD='비번' TIDB_DB=todo node scripts/test-tidb.mjs
// 비밀번호는 작은따옴표로 감싸세요(특수문자 보호).
import mysql from "mysql2/promise";

const { TIDB_HOST, TIDB_PORT, TIDB_USER, TIDB_PASSWORD } = process.env;
const db = process.env.TIDB_DB || "todo";

if (!TIDB_HOST || !TIDB_USER || !TIDB_PASSWORD) {
  console.error("환경변수가 필요해요: TIDB_HOST, TIDB_PORT, TIDB_USER, TIDB_PASSWORD, (TIDB_DB)");
  process.exit(1);
}

const reject = String(process.env.TIDB_SSL_REJECT || "true").toLowerCase() !== "false";

try {
  // 1) DB 지정 없이 접속(아직 todo가 없을 수 있으므로) — TLS 필수
  const conn = await mysql.createConnection({
    host: TIDB_HOST,
    port: Number(TIDB_PORT || 4000),
    user: TIDB_USER,
    password: TIDB_PASSWORD,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: reject },
  });
  const [[ver]] = await conn.query("SELECT VERSION() AS v");
  await conn.query("CREATE DATABASE IF NOT EXISTS `" + db.replace(/`/g, "") + "`");
  await conn.changeUser({ database: db });
  const [tables] = await conn.query("SHOW TABLES");
  console.log("✅ 연결 성공");
  console.log("   서버:", ver.v);
  console.log("   DB  :", db, "(없으면 자동 생성함)");
  console.log("   현재 테이블 수:", tables.length, "(앱 첫 호출 때 자동 생성됨)");
  await conn.end();
} catch (e) {
  console.error("❌ 연결 실패:", e.code || "", e.message);
  if (String(e.message).match(/certificate|self.signed|SSL|TLS/i)) {
    console.error("   → 인증서 오류면 TIDB_SSL_REJECT=false 로 다시 시도해 보세요.");
  }
  process.exit(1);
}
