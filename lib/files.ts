import "server-only";

export const QR_MAX_BYTES = 2 * 1024 * 1024;
export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

export type AllowedFile = { mime: string; ext: string };

/**
 * Detects the real file type from magic bytes. The browser-provided MIME type
 * and file name are never trusted.
 */
export async function sniffFile(file: File): Promise<AllowedFile | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const starts = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: "png" };
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (starts(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) {
    return { mime: "image/webp", ext: "webp" };
  }
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return { mime: "application/pdf", ext: "pdf" };
  return null;
}

export async function validateUpload(
  value: FormDataEntryValue | null,
  { maxBytes, allowed }: { maxBytes: number; allowed: string[] },
): Promise<{ ok: true; file: File; type: AllowedFile } | { ok: false; error: string }> {
  if (!value || typeof value === "string" || value.size === 0) {
    return { ok: false, error: "Adjunta un archivo." };
  }
  if (value.size > maxBytes) {
    return { ok: false, error: `El archivo supera ${Math.round(maxBytes / 1024 / 1024)} MB.` };
  }
  const type = await sniffFile(value);
  if (!type || !allowed.includes(type.mime)) {
    return { ok: false, error: "Formato no permitido." };
  }
  return { ok: true, file: value, type };
}
