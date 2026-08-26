import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const CREDENTIALS_JSON = path.join(DATA_DIR, "credentials.json");

interface CredentialRecord {
  email: string;
  hash: string;
  salt: string;
  updatedAt: string;
}

const _credentialsCache = new Map<string, CredentialRecord>();

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CREDENTIALS_JSON)) {
      fs.writeFileSync(CREDENTIALS_JSON, JSON.stringify({}), "utf8");
    }
  } catch (err) {
    console.warn("[Credentials Storage] Directory creation warning:", err);
  }
}

function loadStoreFromFile(): Record<string, CredentialRecord> {
  ensureDirectories();
  try {
    if (fs.existsSync(CREDENTIALS_JSON)) {
      const raw = fs.readFileSync(CREDENTIALS_JSON, "utf8");
      return JSON.parse(raw) || {};
    }
  } catch (err) {
    console.warn("[Credentials Storage] Read error:", err);
  }
  return {};
}

function saveStoreToFile(data: Record<string, CredentialRecord>) {
  ensureDirectories();
  try {
    fs.writeFileSync(CREDENTIALS_JSON, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[Credentials Storage] Write error:", err);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function saveUserCredentials(email: string, password: string): void {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) return;

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);

  const record: CredentialRecord = {
    email: cleanEmail,
    hash,
    salt,
    updatedAt: new Date().toISOString(),
  };

  _credentialsCache.set(cleanEmail, record);
  const store = loadStoreFromFile();
  store[cleanEmail] = record;
  saveStoreToFile(store);
  console.log(`[CredentialsStore] Saved password hash for: ${cleanEmail}`);
}

export function verifyUserCredentials(email: string, password: string): boolean {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) return false;

  let record = _credentialsCache.get(cleanEmail);
  if (!record) {
    const store = loadStoreFromFile();
    if (store[cleanEmail]) {
      record = store[cleanEmail];
      _credentialsCache.set(cleanEmail, record);
    }
  }

  if (!record) {
    // Default fallback for admin accounts if not yet set
    if (cleanEmail === "projekt@iskral.pl" || cleanEmail === "projekt@motywo.pl") {
      if (password === "AdminPassword2026!" || password === "iskral1!") {
        saveUserCredentials(cleanEmail, password);
        return true;
      }
    }
    return false;
  }

  const calculatedHash = hashPassword(password, record.salt);
  return calculatedHash === record.hash;
}
