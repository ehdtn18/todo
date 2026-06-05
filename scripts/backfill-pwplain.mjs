// users.pw_plain 컬럼 추가 + 기존 계정의 평문 비밀번호 채우기(비밀번호 찾기 마스킹 표시용).
// 비밀번호는 코드에 두지 않고 env 로 주입한다(공개 레포에 커밋 금지).
// 실행(Git Bash): DB_* / DB_SSL=true  PRIMARY_PW=강동수비번 DUMMY_PW=더미공통비번  node scripts/backfill-pwplain.mjs
import { getPool } from "../lib/db.js";

const PRIMARY_PW = process.env.PRIMARY_PW;
const DUMMY_PW = process.env.DUMMY_PW || "test1234!";
const MAP = {
  "kds@careid.center": PRIMARY_PW,
  "dajeong@careid.center": DUMMY_PW,
  "sumin@careid.center": DUMMY_PW,
  "jaehyuk@careid.center": DUMMY_PW,
  "yunji@careid.center": DUMMY_PW,
};

(async () => {
  try {
    const pool = getPool();
    try { await pool.query("ALTER TABLE users ADD COLUMN pw_plain VARCHAR(255)"); } catch {}
    const done = [];
    for (const [email, pw] of Object.entries(MAP)) {
      if (!pw) continue;
      const [r] = await pool.query("UPDATE users SET pw_plain=? WHERE email=?", [pw, email]);
      if (r.affectedRows) done.push(email);
    }
    console.log("✅ pw_plain 채움:", done.join(", ") || "(없음)");
    process.exit(0);
  } catch (e) {
    console.error("❌ 실패:", e.code || "", e.message);
    process.exit(1);
  }
})();
