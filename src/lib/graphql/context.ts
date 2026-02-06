import { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { GraphQLContext, User } from "@/types";

/**
 * Build the Apollo Server context from the incoming request.
 * Extracts the custom JWT from the Authorization header,
 * verifies it, and resolves the user + tenant.
 */
export async function createContext(
  req: NextRequest
): Promise<GraphQLContext> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return { user: null, tenantId: null };
  }

  try {
    // Verify our custom JWT
    const payload = verifyJwt(token);

    if (!payload) {
      return { user: null, tenantId: null };
    }

    // Fetch the full user record from the database
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", payload.user_id)
      .single();

    if (!user) {
      return { user: null, tenantId: null };
    }

    return {
      user: user as User,
      tenantId: user.tenant_id,
    };
  } catch {
    return { user: null, tenantId: null };
  }
}
