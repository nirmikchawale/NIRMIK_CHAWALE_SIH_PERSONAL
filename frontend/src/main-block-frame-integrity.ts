/** 3DB-13: fail closed on tampered source-backed scientific frames. */
export const MAIN_BLOCK_FRAME_INTEGRITY_VERSION = "3db-13-v1";

/** Hash downloaded ORIGINAL bytes, never re-serialized JSON. */
export async function assertPilotFrameSha256(bytes: ArrayBuffer, expected: string, blockId: string, date: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(expected)) throw new Error(`3DB-13 invalid manifest SHA-256 for ${blockId} ${date}.`);
  if (!globalThis.crypto?.subtle) throw new Error("3DB-13 source SHA-256 verification requires a secure context; scientific rendering blocked.");
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  const actual = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (actual !== expected) throw new Error(`3DB-13 source SHA-256 mismatch for ${blockId} ${date}; scientific rendering blocked.`);
}
