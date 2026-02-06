/**
 * QPay API Client — Payment gateway for Mongolia
 */

const QPAY_API_URL = process.env.QPAY_API_URL!;
const QPAY_USERNAME = process.env.QPAY_USERNAME!;
const QPAY_PASSWORD = process.env.QPAY_PASSWORD!;
const QPAY_INVOICE_CODE = process.env.QPAY_INVOICE_CODE!;

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

interface QPayTokenResponse {
  token_type: string;
  refresh_expires_in: number;
  refresh_token: string;
  access_token: string;
  expires_in: number;
  scope: string;
  session_state: string;
}

interface QPayInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  qPay_shortUrl: string;
  urls: Array<{
    name: string;
    description: string;
    logo: string;
    link: string;
  }>;
}

interface QPayPaymentCheckResponse {
  count: number;
  paid_amount: number;
  rows: Array<{
    payment_id: string;
    payment_status: string;
    payment_amount: number;
  }>;
}

/**
 * Authenticate with QPay and obtain an access token.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(`${QPAY_API_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    throw new Error("QPay authentication failed");
  }

  const data: QPayTokenResponse = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000; // refresh 1 min early

  return cachedToken;
}

/**
 * Create a QPay invoice for an order.
 */
export async function createInvoice(
  orderId: string,
  amount: number,
  description: string,
  callbackUrl: string
): Promise<QPayInvoiceResponse> {
  const token = await getAccessToken();

  const response = await fetch(`${QPAY_API_URL}/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      invoice_code: QPAY_INVOICE_CODE,
      sender_invoice_no: orderId,
      invoice_receiver_code: "terminal",
      invoice_description: description,
      amount,
      callback_url: `${callbackUrl}?order_id=${orderId}`,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create QPay invoice");
  }

  return response.json();
}

/**
 * Check payment status for a QPay invoice.
 */
export async function checkPayment(
  invoiceId: string
): Promise<QPayPaymentCheckResponse> {
  const token = await getAccessToken();

  const response = await fetch(`${QPAY_API_URL}/payment/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to check QPay payment");
  }

  return response.json();
}
