import crypto from "crypto";
import bcrypt from "bcryptjs";

export const AUTH_COOKIE = "todo_auth";
export const TEAMS = ["기획팀", "경영지원팀", "개발팀", "디자인팀", "MD팀"];
const SECRET = process.env.AUTH_SECRET || "todo-dev-insecure-secret-please-set-AUTH_SECRET";
const MAXAGE = 60 * 60 * 24 * 30; // 30일

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s) {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}
function sign(body) {
  return b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
}

export function makeToken(user) {
  const payload = { uid: user.id, email: user.email, name: user.name, team: user.team, t: Math.floor(Date.now() / 1000) };
  const body = b64url(JSON.stringify(payload));
  return body + "." + sign(body);
}
export function readToken(token) {
  if (!token || token.indexOf(".") < 0) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || sign(body) !== sig) return null;
  try { return JSON.parse(fromB64url(body)); } catch { return null; }
}

export async function hashPw(pw) { return bcrypt.hash(String(pw), 10); }
export async function verifyPw(pw, hash) { try { return await bcrypt.compare(String(pw), hash); } catch { return false; } }

// NextRequest -> { uid, email, name, team } | null
export function getAuth(req) {
  try { return readToken(req.cookies?.get?.(AUTH_COOKIE)?.value); } catch { return null; }
}

export function cookieOpts() {
  return { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAXAGE, secure: process.env.NODE_ENV === "production" };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── 비밀번호 정책(서버 검증) ──
const COMMON_PW = ["password", "qwerty", "123456", "12345678", "123456789", "111111", "abc123", "iloveyou", "admin", "welcome", "letmein", "qwerty123", "password1", "1q2w3e4r", "asdfghjkl", "zxcvbnm", "000000", "qwertyuiop", "monkey", "dragon"];
function hasSeq(pw) {
  const s = pw.toLowerCase();
  let up = 1, dn = 1, sm = 1;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    up = d === 1 ? up + 1 : 1; dn = d === -1 ? dn + 1 : 1; sm = d === 0 ? sm + 1 : 1;
    if (up >= 4 || dn >= 4 || sm >= 4) return true;
  }
  return false;
}
// 통과하면 null, 아니면 에러 메시지
export function passwordPolicyError(pw, email) {
  pw = String(pw || "");
  if (pw.length < 10 || pw.length > 64) return "비밀번호는 10자 이상 64자 이하여야 해요";
  const types = (/[A-Za-z]/.test(pw) ? 1 : 0) + (/[0-9]/.test(pw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  if (types < 3) return "영문·숫자·특수문자를 모두 포함해야 해요";
  const local = String(email || "").split("@")[0].toLowerCase().trim();
  const lp = pw.toLowerCase();
  if (local.length >= 3 && (lp === local || lp.indexOf(local) >= 0 || local.indexOf(lp) >= 0)) return "아이디(이메일)와 비슷한 비밀번호는 쓸 수 없어요";
  if (hasSeq(pw)) return "연속·반복 문자(1234·abcd·aaaa)는 쓸 수 없어요";
  if (COMMON_PW.indexOf(lp) >= 0) return "너무 흔한 비밀번호예요";
  return null;
}

// 문자열 가운데 약 n글자를 *로 가린다(아이디/비밀번호 찾기 표시용)
export function maskMid(s, n = 3) {
  s = String(s || "");
  if (s.length <= 1) return "*";
  if (s.length <= 4) return s[0] + "*".repeat(s.length - 1);
  const start = Math.max(1, Math.floor((s.length - n) / 2));
  return s.slice(0, start) + "*".repeat(n) + s.slice(start + n);
}
export function maskEmail(e) {
  e = String(e || "");
  const i = e.indexOf("@");
  if (i < 0) return maskMid(e);
  return maskMid(e.slice(0, i)) + e.slice(i);
}
