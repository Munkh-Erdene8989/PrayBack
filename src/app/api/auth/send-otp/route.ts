import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendOtp, generateOtpCode } from "@/lib/callpro/client";

/**
 * POST /api/auth/send-otp
 * Body: { phone: string }
 *
 * Generates a 4-digit OTP, stores it in the `otp_codes` table,
 * and sends it to the given phone number via CallPro SMS.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    // ---- Validation ----
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Утасны дугаар шаардлагатай" },
        { status: 400 }
      );
    }

    // Strip spaces/dashes; accept 8-digit Mongolian numbers
    const cleaned = phone.replace(/[\s\-()]/g, "");
    if (!/^\d{8}$/.test(cleaned)) {
      return NextResponse.json(
        { error: "Утасны дугаар 8 оронтой байх ёстой" },
        { status: 400 }
      );
    }

    // ---- Simple rate-limit: max 1 OTP per phone within 60 seconds ----
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { data: recentOtp } = await supabaseAdmin
      .from("otp_codes")
      .select("id")
      .eq("phone", cleaned)
      .gte("created_at", oneMinuteAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      return NextResponse.json(
        { error: "1 минутын дотор дахин илгээх боломжгүй" },
        { status: 429 }
      );
    }

    // ---- Generate & store OTP ----
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    const { error: dbError } = await supabaseAdmin.from("otp_codes").insert({
      phone: cleaned,
      code,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      console.error("OTP insert error:", dbError);
      return NextResponse.json(
        { error: "OTP үүсгэхэд алдаа гарлаа" },
        { status: 500 }
      );
    }

    // ---- Send via CallPro ----
    const result = await sendOtp(cleaned, code);

    if (!result.success) {
      return NextResponse.json(
        { error: "SMS илгээхэд алдаа гарлаа" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP код илгээгдлээ",
      phone: cleaned,
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    );
  }
}
