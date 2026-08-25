import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TWO_FACTOR_JSON = path.join(DATA_DIR, "two_factor.json");

interface TwoFactorRecord {
  secret: string;
  enabled: boolean;
  updatedAt: string;
}

// In-memory cache for speed
const _twoFactorStore = new Map<string, TwoFactorRecord>();

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TWO_FACTOR_JSON)) {
      fs.writeFileSync(TWO_FACTOR_JSON, JSON.stringify({}), "utf8");
    }
  } catch (err) {
    console.warn("[2FA Storage] Directory creation warning:", err);
  }
}

function loadStoreFromFile(): Record<string, TwoFactorRecord> {
  ensureDirectories();
  try {
    if (fs.existsSync(TWO_FACTOR_JSON)) {
      const raw = fs.readFileSync(TWO_FACTOR_JSON, "utf8");
      return JSON.parse(raw) || {};
    }
  } catch (err) {
    console.warn("[2FA Storage] Read error:", err);
  }
  return {};
}

function saveStoreToFile(data: Record<string, TwoFactorRecord>) {
  ensureDirectories();
  try {
    fs.writeFileSync(TWO_FACTOR_JSON, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[2FA Storage] Write error:", err);
  }
}

export function saveUser2FASecret(email: string, secret: string, enabled = true): void {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !secret) return;

  const record: TwoFactorRecord = {
    secret: secret.trim(),
    enabled,
    updatedAt: new Date().toISOString(),
  };

  _twoFactorStore.set(cleanEmail, record);
  const store = loadStoreFromFile();
  store[cleanEmail] = record;
  saveStoreToFile(store);
}

export function getUser2FASecret(email: string): string | null {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return null;

  if (_twoFactorStore.has(cleanEmail)) {
    const rec = _twoFactorStore.get(cleanEmail);
    return rec?.enabled ? rec.secret : null;
  }

  const store = loadStoreFromFile();
  if (store[cleanEmail]) {
    _twoFactorStore.set(cleanEmail, store[cleanEmail]);
    return store[cleanEmail].enabled ? store[cleanEmail].secret : null;
  }

  return null;
}

export function isUser2FAEnabled(email: string): boolean {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return false;

  if (_twoFactorStore.has(cleanEmail)) {
    return Boolean(_twoFactorStore.get(cleanEmail)?.enabled);
  }

  const store = loadStoreFromFile();
  if (store[cleanEmail]) {
    _twoFactorStore.set(cleanEmail, store[cleanEmail]);
    return Boolean(store[cleanEmail].enabled);
  }

  return false;
}

export function disableUser2FA(email: string): void {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return;

  const store = loadStoreFromFile();
  if (store[cleanEmail]) {
    store[cleanEmail].enabled = false;
    saveStoreToFile(store);
  }
  _twoFactorStore.delete(cleanEmail);
}
