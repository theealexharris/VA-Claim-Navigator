import fs from "fs";
import path from "path";
import crypto from "crypto";
import { randomUUID } from "crypto";

// ─── Persistence location ────────────────────────────────────────────────────
// NOTE: We deliberately do NOT use TEMP_UPLOAD_DIR — that directory is swept of
// old files every 30 min, which would delete affiliate accounts. Use a dedicated
// data dir. On Vercel only /tmp is writable; elsewhere use the project root.
const isVercel = !!process.env.VERCEL;
const DATA_DIR = process.env.AFFILIATE_DATA_DIR
  ? process.env.AFFILIATE_DATA_DIR
  : isVercel
    ? path.join("/tmp", "vcn-data")
    : path.join(process.cwd(), ".vcn-data");
const DATA_FILE = path.join(DATA_DIR, "affiliates.json");

try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (err: any) {
  console.warn(`[AFFILIATE] Could not create data dir: ${err.message}`);
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Affiliate {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;         // stored lowercase
  passwordHash: string;  // scrypt hash (hex)
  salt: string;          // hex
  phone?: string;
  website?: string;
  promoMethod?: string;
  paypalEmail?: string;
  bankAccount?: string;
  createdAt: string;
}

export interface ClickRecord {
  code: string;   // affiliate code (uppercased)
  at: string;     // ISO timestamp
}

export interface ReferralRecord {
  id: string;
  affiliateId: string;
  code: string;
  email: string;                                   // masked for privacy
  status: "pending" | "subscribed" | "cancelled";
  joinedDate: string;
  monthlyEarn: number;                             // affiliate's commission on this referral
}

interface DB {
  affiliates: Affiliate[];
  clicks: ClickRecord[];
  referrals: ReferralRecord[];
}

// Affiliate commission rate applied to each converted referral.
const COMMISSION_RATE = 0.20;

// ─── In-memory cache backed by JSON file ─────────────────────────────────────
let db: DB = { affiliates: [], clicks: [], referrals: [] };
let loaded = false;

function load(): void {
  if (loaded) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.affiliates)) {
        db = {
          affiliates: parsed.affiliates,
          clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
          referrals: Array.isArray(parsed.referrals) ? parsed.referrals : [],
        };
      }
    }
  } catch (err: any) {
    console.warn(`[AFFILIATE] Could not read data file: ${err.message}`);
    db = { affiliates: [], clicks: [], referrals: [] };
  }
  loaded = true;
}

function maskEmailLocal(email: string): string {
  const [user, domain] = String(email || "").split("@");
  if (!domain) return "•••";
  const shown = user.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function persist(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err: any) {
    console.error(`[AFFILIATE] Could not write data file: ${err.message}`);
  }
}

// ─── Password hashing (scrypt, Node built-in) ────────────────────────────────
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return { hash, salt: useSalt };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ─── Unique code generation ──────────────────────────────────────────────────
export function generateAffiliateCode(firstName: string, lastName: string): string {
  load();
  const base = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) || "VCN";
  let code = "";
  // Ensure uniqueness against existing codes.
  for (let i = 0; i < 10; i++) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
    code = `${base}-${suffix}`;
    if (!db.affiliates.some((a) => a.code === code)) return code;
  }
  return `${base}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────
export function getByEmail(email: string): Affiliate | undefined {
  load();
  const e = String(email || "").trim().toLowerCase();
  return db.affiliates.find((a) => a.email === e);
}

export function getById(id: string): Affiliate | undefined {
  load();
  return db.affiliates.find((a) => a.id === id);
}

export function getByCode(code: string): Affiliate | undefined {
  load();
  const c = String(code || "").trim().toUpperCase();
  return db.affiliates.find((a) => a.code.toUpperCase() === c);
}

export interface CreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  promoMethod?: string;
}

export function createAffiliate(input: CreateInput): Affiliate {
  load();
  const email = String(input.email).trim().toLowerCase();
  if (getByEmail(email)) {
    throw new Error("An affiliate account already exists with that email.");
  }
  const { hash, salt } = hashPassword(input.password);
  const affiliate: Affiliate = {
    id: randomUUID(),
    code: generateAffiliateCode(input.firstName, input.lastName),
    firstName: String(input.firstName).trim(),
    lastName: String(input.lastName).trim(),
    email,
    passwordHash: hash,
    salt,
    phone: input.phone?.trim() || undefined,
    website: input.website?.trim() || undefined,
    promoMethod: input.promoMethod?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  db.affiliates.push(affiliate);
  persist();
  return affiliate;
}

export function verifyLogin(email: string, password: string): Affiliate | null {
  const affiliate = getByEmail(email);
  if (!affiliate) return null;
  if (!verifyPassword(password, affiliate.salt, affiliate.passwordHash)) return null;
  return affiliate;
}

export interface UpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  website?: string;
  paypalEmail?: string;
  bankAccount?: string;
  currentPassword?: string;
  newPassword?: string;
}

/** Returns { affiliate } on success or { error } on failure. */
export function updateAffiliate(id: string, patch: UpdateInput): { affiliate?: Affiliate; error?: string } {
  load();
  const affiliate = getById(id);
  if (!affiliate) return { error: "Affiliate not found." };

  // Email change — ensure not taken by someone else.
  if (patch.email && patch.email.trim().toLowerCase() !== affiliate.email) {
    const newEmail = patch.email.trim().toLowerCase();
    const existing = getByEmail(newEmail);
    if (existing && existing.id !== id) return { error: "That email is already in use." };
    affiliate.email = newEmail;
  }

  // Password change — requires correct current password.
  if (patch.newPassword) {
    if (!patch.currentPassword || !verifyPassword(patch.currentPassword, affiliate.salt, affiliate.passwordHash)) {
      return { error: "Current password is incorrect." };
    }
    if (patch.newPassword.length < 8) return { error: "New password must be at least 8 characters." };
    const { hash, salt } = hashPassword(patch.newPassword);
    affiliate.passwordHash = hash;
    affiliate.salt = salt;
  }

  if (patch.firstName !== undefined) affiliate.firstName = patch.firstName.trim();
  if (patch.lastName !== undefined) affiliate.lastName = patch.lastName.trim();
  if (patch.phone !== undefined) affiliate.phone = patch.phone.trim() || undefined;
  if (patch.website !== undefined) affiliate.website = patch.website.trim() || undefined;
  if (patch.paypalEmail !== undefined) affiliate.paypalEmail = patch.paypalEmail.trim() || undefined;
  if (patch.bankAccount !== undefined) affiliate.bankAccount = patch.bankAccount.trim() || undefined;

  persist();
  return { affiliate };
}

// ─── Public projection (never leak hashes) ───────────────────────────────────
export function publicView(a: Affiliate) {
  return {
    id: a.id,
    code: a.code,
    firstName: a.firstName,
    lastName: a.lastName,
    name: `${a.firstName} ${a.lastName}`.trim(),
    email: a.email,
    phone: a.phone || "",
    website: a.website || "",
    paypalEmail: a.paypalEmail || "",
    bankAccount: a.bankAccount ? "•••• saved" : "",
    createdAt: a.createdAt,
  };
}

// ─── Session tokens (HMAC-signed, stateless) ─────────────────────────────────
function sessionSecret(): string {
  return process.env.SESSION_SECRET || "vcn-affiliate-dev-secret-change-me";
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signSession(affiliateId: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${affiliateId}.${expires}`;
  const sig = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifySession(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [affiliateId, expiresStr, sig] = parts;
    const payload = `${affiliateId}.${expiresStr}`;
    const expected = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    if (Date.now() > Number(expiresStr)) return null;
    return affiliateId;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────
export const AFFILIATE_COOKIE = "aff_session";

export function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const attrs = [
    `${AFFILIATE_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (isProd) attrs.push("Secure");
  return attrs.join("; ");
}

export function buildClearCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  const attrs = [`${AFFILIATE_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isProd) attrs.push("Secure");
  return attrs.join("; ");
}

// ─── Click & conversion tracking ─────────────────────────────────────────────

/** Record a click on an affiliate link. Returns true if the code matched an affiliate. */
export function recordClick(code: string): boolean {
  load();
  const affiliate = getByCode(code);
  if (!affiliate) return false;
  db.clicks.push({ code: affiliate.code.toUpperCase(), at: new Date().toISOString() });
  persist();
  return true;
}

/**
 * Record a converted referral (a paid subscription attributed to an affiliate code).
 * amountPaid is in dollars. Returns the created referral, or null if the code is unknown.
 */
export function recordConversion(code: string, email: string, amountPaid: number): ReferralRecord | null {
  load();
  const affiliate = getByCode(code);
  if (!affiliate) return null;
  const commission = Math.round(Math.max(0, amountPaid) * COMMISSION_RATE * 100) / 100;
  const referral: ReferralRecord = {
    id: randomUUID(),
    affiliateId: affiliate.id,
    code: affiliate.code.toUpperCase(),
    email: maskEmailLocal(email),
    status: "subscribed",
    joinedDate: new Date().toISOString(),
    monthlyEarn: commission,
  };
  db.referrals.push(referral);
  persist();
  return referral;
}

/** Referral rows for an affiliate, shaped for the dashboard table. */
export function referralsFor(affiliateId: string): ReferralRecord[] {
  load();
  return db.referrals
    .filter((r) => r.affiliateId === affiliateId)
    .sort((a, b) => (a.joinedDate < b.joinedDate ? 1 : -1));
}

// ─── Stats (computed from real clicks + referrals) ───────────────────────────
export function statsFor(affiliate: Affiliate) {
  load();
  const code = affiliate.code.toUpperCase();
  const totalClicks = db.clicks.filter((c) => c.code === code).length;
  const referrals = db.referrals.filter((r) => r.affiliateId === affiliate.id);
  const totalSignups = referrals.length;
  const active = referrals.filter((r) => r.status === "subscribed");
  const activeSubscribers = active.length;
  const totalEarned = Math.round(active.reduce((s, r) => s + r.monthlyEarn, 0) * 100) / 100;

  const now = new Date();
  const thisMonthEarned = Math.round(
    active
      .filter((r) => {
        const d = new Date(r.joinedDate);
        return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
      })
      .reduce((s, r) => s + r.monthlyEarn, 0) * 100,
  ) / 100;

  const conversionRate = totalClicks > 0 ? `${((totalSignups / totalClicks) * 100).toFixed(1)}%` : "0%";

  return {
    totalClicks,
    totalSignups,
    activeSubscribers,
    totalEarned,
    pendingPayout: thisMonthEarned, // unpaid balance = current month's earnings until payout runs
    thisMonthEarned,
    conversionRate,
  };
}
