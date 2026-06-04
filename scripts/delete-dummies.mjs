// QA용 더미 계정(다정·수민·재혁)과 그들의 모든 데이터 삭제.
// 실행(Git Bash): DB_* / DB_SSL=true 설정 후  node scripts/delete-dummies.mjs
import { getPool } from "../lib/db.js";

const EMAILS = ["dajeong@careid.center", "sumin@careid.center", "jaehyuk@careid.center", "yunji@careid.center"];

(async () => {
  try {
    const pool = getPool();
    const [users] = await pool.query("SELECT id, name, email FROM users WHERE email IN (?)", [EMAILS]);
    if (!users.length) { console.log("삭제할 더미 계정이 없어요."); process.exit(0); }
    const ids = users.map((u) => u.id);
    for (const t of ["tasks", "trash", "leaves", "settings"]) {
      const col = t === "settings" ? "owner" : "owner";
      await pool.query(`DELETE FROM ${t} WHERE ${col} IN (?)`, [ids]);
    }
    await pool.query("DELETE FROM users WHERE id IN (?)", [ids]);
    console.log("✅ 더미 삭제 완료:", users.map((u) => u.name + "(" + u.email + ")").join(", "));
    process.exit(0);
  } catch (e) {
    console.error("❌ 실패:", e.code || "", e.message);
    process.exit(1);
  }
})();
