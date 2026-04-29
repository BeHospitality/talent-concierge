// Shared secret-validation helpers for inbound webhook endpoints.
// Build #1C — Stage 2.

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export type SecretCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function validateSecret(
  req: Request,
  headerName: string,
  envVarName: string,
): SecretCheck {
  const provided = req.headers.get(headerName);
  const expected = Deno.env.get(envVarName);
  if (!expected) {
    return { ok: false, status: 500, error: "Server misconfiguration: secret not set" };
  }
  if (!provided) {
    return { ok: false, status: 401, error: "Missing authentication header" };
  }
  if (!timingSafeEqual(provided, expected)) {
    return { ok: false, status: 401, error: "Authentication failed" };
  }
  return { ok: true };
}
