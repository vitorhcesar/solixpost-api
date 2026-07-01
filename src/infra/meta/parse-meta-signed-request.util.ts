import { createHmac, timingSafeEqual } from "node:crypto";

export interface IMetaSignedRequestPayload {
  algorithm: string;
  issued_at?: number;
  expires?: number;
  user_id: string;
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);

  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function parseMetaSignedRequest(
  signedRequest: string,
  appSecret: string,
): IMetaSignedRequestPayload | null {
  const parts = signedRequest.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encodedSig, payload] = parts;

  if (!encodedSig || !payload) {
    return null;
  }

  let sig: Buffer;

  try {
    sig = base64UrlDecodeToBuffer(encodedSig);
  } catch {
    return null;
  }

  const expectedSig = createHmac("sha256", appSecret).update(payload).digest();

  if (
    sig.length !== expectedSig.length ||
    !timingSafeEqual(sig, expectedSig)
  ) {
    return null;
  }

  let data: IMetaSignedRequestPayload;

  try {
    data = JSON.parse(
      base64UrlDecodeToBuffer(payload).toString("utf8"),
    ) as IMetaSignedRequestPayload;
  } catch {
    return null;
  }

  if (data.algorithm?.toUpperCase() !== "HMAC-SHA256" || !data.user_id) {
    return null;
  }

  return data;
}
