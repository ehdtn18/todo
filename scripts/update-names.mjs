// users.first_name 컬럼 추가 + 기존 계정 이름을 성+이름(전체)로, 표시용 이름(first_name) 채우기.
// 실행(Git Bash): DB_* / DB_SSL=true 설정 후  node scripts/update-names.mjs
import { getPool } from "../lib/db.js";

// email -> { name(전체=성+이름), first(표시용 이름) }
const NAMES = {
  "kds@careid.center": { name: "강동수", first: "동수" },
  "dajeong@careid.center": { name: "이다정", first: "다정" },
  "sumin@careid.center": { name: "안수민", first: "수민" },
  "yunji@careid.center": { name: "남윤지", first: "윤지" },
  "jaehyuk@careid.center": { name: "최재혁", first: "재혁" },
};

(async () => {
  try {
    const pool = getPool();
    try { await pool.query("ALTER TABLE users ADD COLUMN first_name VARCHAR(80)"); } catch {}
    const done = [];
    for (const [email, v] of Object.entries(NAMES)) {
      const [r] = await pool.query("UPDATE users SET name=?, first_name=? WHERE email=?", [v.name, v.first, email]);
      if (r.affectedRows) done.push(`${email} → ${v.name}(${v.first})`);
    }
    // 그 외 first_name 비어있는 계정은 name 으로 채워 둔다(표시 폴백 일관성).
    await pool.query("UPDATE users SET first_name=name WHERE first_name IS NULL OR first_name=''");
    const [all] = await pool.query("SELECT name, first_name, team, email FROM users ORDER BY team, name");
    console.log("✅ 이름 업데이트:", done.join(", ") || "(매칭 없음)");
    console.log("현재 users:", all.map((u) => `${u.name}/${u.first_name}/${u.team}`).join(", "));
    process.exit(0);
  } catch (e) {
    console.error("❌ 실패:", e.code || "", e.message);
    process.exit(1);
  }
})();
