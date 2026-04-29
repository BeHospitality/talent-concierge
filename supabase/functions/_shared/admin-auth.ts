// Shared auth helper for fire-email-N endpoints.
// Build #1C — Stage 5.
//
// Accepts EITHER:
//   (a) Bearer SUPABASE_SERVICE_ROLE_KEY  (internal/system callers)
//   (b) Bearer <user JWT> belonging to a user with the 'admin' role
//
// Returns { ok, operatorUserId } on success or { ok: false, status, error }.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { timingSafeEqual } from "./secrets.ts";

export type AdminAuthResult =
  | { ok: true; operatorUserId: string | null; serviceRole: boolean }
  | { ok: false; status: number; error: string };

export async function authenticateAdminOrService(
  req: Request,
  supabase: SupabaseClient,
): Promise<AdminAuthResult> {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }
  const token = authHeader.slice(7).trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  // Path 1: service-role bearer (internal use)
  if (serviceRoleKey && token.length === serviceRoleKey.length && timingSafeEqual(token, serviceRoleKey)) {
    return { ok: true, operatorUserId: null, serviceRole: true };
  }

  // Path 2: user JWT — must validate AND have 'admin' role
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return { ok: false, status: 401, error: "Invalid token" };
    }
    const userId = claimsData.claims.sub as string;

    const { data: hasAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr || !hasAdmin) {
      return { ok: false, status: 403, error: "Forbidden: admin role required" };
    }
    return { ok: true, operatorUserId: userId, serviceRole: false };
  } catch (err) {
    return { ok: false, status: 401, error: "Auth validation failed" };
  }
}
