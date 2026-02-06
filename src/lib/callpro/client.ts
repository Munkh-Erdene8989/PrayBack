/**
 * CallPro (MessagePro) API Client — Phone OTP service for Mongolia
 *
 * API Documentation (from CallPro.pdf):
 *   URL:     https://api.messagepro.mn/send
 *   Method:  GET
 *   Params:  from, to, text
 *   Header:  x-api-key
 *   Throttle: 5 requests/second
 */

const CALLPRO_API_URL =
  process.env.CALLPRO_API_URL || "https://api.messagepro.mn/send";
const CALLPRO_API_KEY =
  process.env.CALLPRO_API_KEY || "fe5c72c75ea0825476eca7172c8f5854";
const CALLPRO_FROM = process.env.CALLPRO_FROM || "72720880";

interface SendSmsResponse {
  Result: string;
  "Message ID"?: number;
}

interface SendOtpResult {
  success: boolean;
  message?: string;
}

/**
 * Send an OTP code to a phone number via MessagePro SMS.
 *
 * The API uses GET with query parameters:
 *   ?from=<special_number>&to=<phone>&text=<message>
 * and requires the `x-api-key` header for authentication.
 */
export async function sendOtp(
  phone: string,
  code: string
): Promise<SendOtpResult> {
  const text = `Tany batalgaajuulah kod: ${code}`;

  // Build query string
  const url = new URL(CALLPRO_API_URL);
  url.searchParams.set("from", CALLPRO_FROM);
  url.searchParams.set("to", phone);
  url.searchParams.set("text", text);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": CALLPRO_API_KEY,
      },
    });

    if (!response.ok) {
      const status = response.status;
      let errorMsg = "SMS илгээхэд алдаа гарлаа";

      if (status === 402) {
        errorMsg = "Байгууллага төлбөрийн улмаас хаагдсан";
      } else if (status === 403) {
        errorMsg = "API key буруу эсвэл дамжуулаагүй";
      } else if (status === 404) {
        errorMsg = "Байгууллага эсвэл тусгай дугаар идэвхгүй";
      } else if (status === 503) {
        errorMsg = "API throttle хязгаарт хүрсэн (1 секундэд 5 хүсэлт)";
      }

      console.error(`MessagePro SMS error: ${status} - ${errorMsg}`);
      return { success: false, message: errorMsg };
    }

    const data: SendSmsResponse[] = await response.json();

    if (data?.[0]?.Result === "SUCCESS") {
      return { success: true };
    }

    return { success: false, message: "SMS илгээхэд алдаа гарлаа" };
  } catch (err) {
    console.error("MessagePro SMS exception:", err);
    return { success: false, message: "SMS сервертэй холбогдож чадсангүй" };
  }
}

/**
 * Generate a random 4-digit OTP code.
 */
export function generateOtpCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
