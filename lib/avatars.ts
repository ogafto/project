import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const AVATARS_JSON = path.join(DATA_DIR, "avatars.json");
const PUBLIC_AVATARS_DIR = path.join(process.cwd(), "public", "avatars");

// In-memory cache for ultra-fast lookups
const _avatarMemoryStore = new Map<string, string>();

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PUBLIC_AVATARS_DIR)) {
      fs.mkdirSync(PUBLIC_AVATARS_DIR, { recursive: true });
    }
    if (!fs.existsSync(AVATARS_JSON)) {
      fs.writeFileSync(AVATARS_JSON, JSON.stringify({}), "utf8");
    }
  } catch (err) {
    console.warn("[Avatar Storage] Directory creation warning:", err);
  }
}

function loadAvatarsFromFile(): Record<string, string> {
  ensureDirectories();
  try {
    if (fs.existsSync(AVATARS_JSON)) {
      const raw = fs.readFileSync(AVATARS_JSON, "utf8");
      return JSON.parse(raw) || {};
    }
  } catch (err) {
    console.warn("[Avatar Storage] Read error:", err);
  }
  return {};
}

function saveAvatarsToFile(data: Record<string, string>) {
  ensureDirectories();
  try {
    fs.writeFileSync(AVATARS_JSON, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[Avatar Storage] Write error:", err);
  }
}

export async function saveUserAvatar(email: string, avatarData: string): Promise<string> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !avatarData) return "";

  ensureDirectories();
  const safeName = cleanEmail.replace(/[^a-z0-9]/g, "_");
  let finalUrl = avatarData;

  // If base64 / data URL, write binary file to public/avatars/
  if (avatarData.startsWith("data:image/")) {
    try {
      const matches = avatarData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const ext = mimeType.includes("webp")
          ? "webp"
          : mimeType.includes("jpeg") || mimeType.includes("jpg")
          ? "jpg"
          : "png";

        const fileName = `avatar_${safeName}.${ext}`;
        const filePath = path.join(PUBLIC_AVATARS_DIR, fileName);

        fs.writeFileSync(filePath, buffer);
        finalUrl = `/avatars/${fileName}?t=${Date.now()}`;
      }
    } catch (err) {
      console.warn("[Avatar Storage] File write fallback:", err);
      finalUrl = avatarData;
    }
  }

  // Update in-memory map and JSON store
  _avatarMemoryStore.set(cleanEmail, finalUrl);
  const store = loadAvatarsFromFile();
  store[cleanEmail] = finalUrl;
  saveAvatarsToFile(store);

  return finalUrl;
}

export function getUserAvatar(email: string): string | null {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return null;

  if (_avatarMemoryStore.has(cleanEmail)) {
    return _avatarMemoryStore.get(cleanEmail) || null;
  }

  const store = loadAvatarsFromFile();
  if (store[cleanEmail]) {
    _avatarMemoryStore.set(cleanEmail, store[cleanEmail]);
    return store[cleanEmail];
  }

  // Check if a file exists in public/avatars
  ensureDirectories();
  const safeName = cleanEmail.replace(/[^a-z0-9]/g, "_");
  const possibleExts = ["webp", "jpg", "png", "jpeg"];
  for (const ext of possibleExts) {
    const fileName = `avatar_${safeName}.${ext}`;
    const filePath = path.join(PUBLIC_AVATARS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const url = `/avatars/${fileName}`;
      _avatarMemoryStore.set(cleanEmail, url);
      return url;
    }
  }

  return null;
}

export function deleteUserAvatar(email: string): void {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return;

  _avatarMemoryStore.delete(cleanEmail);
  const store = loadAvatarsFromFile();
  delete store[cleanEmail];
  saveAvatarsToFile(store);

  ensureDirectories();
  const safeName = cleanEmail.replace(/[^a-z0-9]/g, "_");
  const possibleExts = ["webp", "jpg", "png", "jpeg"];
  for (const ext of possibleExts) {
    const fileName = `avatar_${safeName}.${ext}`;
    const filePath = path.join(PUBLIC_AVATARS_DIR, fileName);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }
}
