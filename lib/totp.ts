import crypto from "crypto";

// Standard Base32 Alphabet (RFC 4648)
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Decodes a base32 string into a Buffer
 */
export function base32Decode(base32Str: string): Buffer {
  const clean = base32Str.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Encodes a Buffer into a base32 string
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generates a TOTP code for a given secret and counter (RFC 6238 / RFC 4226)
 */
export function generateTOTP(secret: string, timeStepSeconds = 30, timeOffsetSteps = 0): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStepSeconds) + timeOffsetSteps;

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuf);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP code against a base32 secret with ±2 time-step tolerance (±60s)
 */
export function verifyTOTP(token: string, secret: string, windowSteps = 2, timeStepSeconds = 30): boolean {
  if (!token || typeof token !== "string") return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;
  if (!secret) return false;

  // Sprawdź bieżący krok oraz tolerancję ±windowSteps (np. -1, 0, +1 krok po 30s)
  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    try {
      const generated = generateTOTP(secret, timeStepSeconds, offset);
      if (generated === cleanToken) {
        return true;
      }
    } catch {
      // Ignoruj błędy pojedynczego kroku
    }
  }

  return false;
}
