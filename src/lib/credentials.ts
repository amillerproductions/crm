import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTION_PREFIX = "enc:v1:";

function getEncryptionKey() {
  const secret = process.env.CREDENTIAL_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error("CREDENTIAL_ENCRYPTION_SECRET is missing.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptCredentialValue(value: string) {
  if (!value) {
    return "";
  }

  const iv = randomBytes(12);
  const key = getEncryptionKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");

  return `${ENCRYPTION_PREFIX}${payload}`;
}

export function decryptCredentialValue(value: string) {
  if (!value) {
    return "";
  }

  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const raw = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const key = getEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
