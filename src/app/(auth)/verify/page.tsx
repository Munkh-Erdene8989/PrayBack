"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

// ---------------------------------------------------------------------------
// OTP input with individual boxes
// ---------------------------------------------------------------------------

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const OTP_LENGTH = 4;

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return; // only digits
    const arr = value.split("");
    arr[idx] = char;
    const next = arr.join("").slice(0, OTP_LENGTH);
    onChange(next);

    // Auto-advance
    if (char && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:opacity-50 text-gray-900"
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Verify form
// ---------------------------------------------------------------------------

function VerifyForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const tenantSlug = searchParams.get("tenant") || undefined;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  // ---- Countdown timer for resend ----
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ---- Auto-submit when 4 digits entered ----
  const handleVerify = useCallback(async () => {
    if (code.length !== 4 || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          tenant_slug: tenantSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Алдаа гарлаа");
        setCode("");
        return;
      }

      // Store token and user via AuthContext
      login(data.token, data.user);

      // Redirect: use tenant_slug from API response, or URL param, or default tenant, or home
      const redirectSlug = data.tenant_slug || tenantSlug || "gandan";
      if (redirectSlug) {
        router.push(`/${redirectSlug}`);
      } else {
        router.push("/");
      }
    } catch {
      setError("Сервертэй холбогдож чадсангүй");
    } finally {
      setLoading(false);
    }
  }, [code, loading, phone, tenantSlug, login, router]);

  useEffect(() => {
    if (code.length === 4) {
      handleVerify();
    }
  }, [code, handleVerify]);

  // ---- Resend OTP ----
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Дахин илгээхэд алдаа гарлаа");
        return;
      }

      setResendCooldown(60);
      setCode("");
    } catch {
      setError("Сервертэй холбогдож чадсангүй");
    } finally {
      setResending(false);
    }
  };

  // ---- Manual submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleVerify();
  };

  // Guard: no phone = redirect back
  if (!phone) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500 mb-4">Утасны дугаар олдсонгүй.</p>
        <button
          onClick={() => router.push("/login")}
          className="text-indigo-600 font-medium hover:underline"
        >
          Нэвтрэх хуудас руу буцах
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Баталгаажуулах
      </h1>
      <p className="text-center text-gray-500 mb-2">
        <span className="font-semibold text-gray-700">+976 {phone}</span>{" "}
        дугаарт 4 оронтой код илгээлээ
      </p>
      <p className="text-center text-gray-400 text-sm mb-8">
        Кодын хүчинтэй хугацаа 5 минут
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OtpInput value={code} onChange={setCode} disabled={loading} />

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 4}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Шалгаж байна...
            </>
          ) : (
            "Баталгаажуулах"
          )}
        </button>
      </form>

      {/* Resend section */}
      <div className="mt-6 text-center">
        {resendCooldown > 0 ? (
          <p className="text-sm text-gray-400">
            Дахин илгээх{" "}
            <span className="font-mono font-medium text-gray-500">
              {resendCooldown}с
            </span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-50"
          >
            {resending ? "Илгээж байна..." : "Код дахин илгээх"}
          </button>
        )}
      </div>

      {/* Back to login */}
      <div className="mt-4 text-center">
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Дугаараа солих
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense
// ---------------------------------------------------------------------------

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-md w-full mx-4">
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-16 w-16 bg-gray-200 rounded-2xl mx-auto" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                <div className="flex gap-3 justify-center mt-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-14 h-14 bg-gray-200 rounded-xl"
                    />
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
