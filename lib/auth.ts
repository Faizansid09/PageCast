export type SessionRole = "controller" | "screen";

export interface SessionPayload {
  role: SessionRole;
  name?: string;
  issuedAt: number;
  expiresAt: number;
}

export const SESSION_COOKIE_NAME = "signage_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "super-secret-key-at-least-32-chars-long-12345"
  );
}

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a session payload and returns a base64url encoded string with signature.
 */
export async function signSession(
  payloadData: { role: SessionRole; name?: string },
  durationSeconds: number = 60 * 60 * 24 * 7
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    role: payloadData.role,
    name: payloadData.name || (payloadData.role === "controller" ? "Controller HQ" : "Display Screen"),
    issuedAt: now,
    expiresAt: now + durationSeconds,
  };

  const encoder = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = bufferToBase64Url(encoder.encode(payloadJson));

  const key = await getCryptoKey(getAuthSecret());
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = bufferToBase64Url(signatureBuffer);

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies a session token string, checking HMAC signature and expiration.
 */
export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signatureB64] = parts;
  try {
    const encoder = new TextEncoder();
    const key = await getCryptoKey(getAuthSecret());
    const signatureBytes = base64UrlToBuffer(signatureB64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValid) {
      return null;
    }

    const payloadBytes = base64UrlToBuffer(payloadB64);
    const decoder = new TextDecoder();
    const payloadText = decoder.decode(payloadBytes);
    const payload = JSON.parse(payloadText) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt && payload.expiresAt < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates a passcode against environment variables or sensible fallbacks.
 */
export function validatePasscode(role: SessionRole, passcode: string): boolean {
  const clean = (passcode || "").trim();
  if (!clean) return false;

  if (role === "controller") {
    const expected = (process.env.CONTROLLER_PASSCODE || "admin123").trim();
    return clean === expected;
  }

  if (role === "screen") {
    const expected = (process.env.SCREEN_PASSCODE || "screen123").trim();
    return clean === expected;
  }

  return false;
}
