import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { signJwt } from "@/lib/auth/jwt";

/**
 * POST /api/auth/verify-otp
 * Body: { phone: string, code: string, tenant_slug?: string }
 *
 * Verifies the OTP code, upserts the user, and returns a signed JWT
 * containing { user_id, role, tenant_id, phone }.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, code, tenant_slug } = await req.json();

    // ---- Validation ----
    if (!phone || !code) {
      return NextResponse.json(
        { error: "Утасны дугаар болон код шаардлагатай" },
        { status: 400 }
      );
    }

    const cleaned = phone.replace(/[\s\-()]/g, "");

    // ---- Verify OTP ----
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("phone", cleaned)
      .eq("code", code)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: "OTP код буруу эсвэл хугацаа дууссан" },
        { status: 400 }
      );
    }

    // ---- Mark OTP as verified ----
    await supabaseAdmin
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // ---- Resolve tenant (optional) ----
    let tenantId: string | null = null;
    if (tenant_slug) {
      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("slug", tenant_slug)
        .single();
      tenantId = tenant?.id ?? null;
    }

    // ---- Upsert user ----
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", cleaned)
      .single();

    let user;

    if (existingUser) {
      user = existingUser;

      // If user doesn't have a tenant yet and one was provided, update it
      if (!existingUser.tenant_id && tenantId) {
        const { data: updatedUser } = await supabaseAdmin
          .from("users")
          .update({ tenant_id: tenantId })
          .eq("id", existingUser.id)
          .select()
          .single();
        user = updatedUser ?? existingUser;
      }
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          phone: cleaned,
          role: "customer",
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (userError || !newUser) {
        console.error("User insert error:", userError);
        return NextResponse.json(
          { error: "Хэрэглэгч үүсгэхэд алдаа гарлаа" },
          { status: 500 }
        );
      }

      user = newUser;
    }

    // ---- Sign JWT ----
    const token = signJwt({
      user_id: user.id,
      role: user.role,
      tenant_id: user.tenant_id,
      phone: user.phone,
    });

    // ---- Get tenant slug if user has a tenant ----
    let tenantSlug = null;
    if (user.tenant_id) {
      const { data: tenantData } = await supabaseAdmin
        .from("tenants")
        .select("slug")
        .eq("id", user.tenant_id)
        .single();
      tenantSlug = tenantData?.slug ?? null;
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
      tenant_slug: tenantSlug,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    );
  }
}
