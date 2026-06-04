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
