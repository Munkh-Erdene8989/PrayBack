import { QPayInvoiceResponse } from '@/types'

const QPAY_API_URL = process.env.QPAY_API_URL || 'https://merchant-sandbox.qpay.mn/v2'
const QPAY_CLIENT_ID = process.env.QPAY_CLIENT_ID!
const QPAY_CLIENT_SECRET = process.env.QPAY_CLIENT_SECRET!
const QPAY_INVOICE_CODE = process.env.QPAY_INVOICE_CODE!
const QPAY_RECEIVER_CODE = process.env.QPAY_RECEIVER_CODE || 'terminal'
const QPAY_MOCK_MODE = process.env.QPAY_MOCK_MODE === 'true'

interface QPayTokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
}

let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token
  }

  // QPay v2 API uses Basic Authentication with CLIENT_ID:CLIENT_SECRET
  const credentials = Buffer.from(`${QPAY_CLIENT_ID}:${QPAY_CLIENT_SECRET}`).toString('base64')

  const response = await fetch(`${QPAY_API_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('QPay auth error:', {
      status: response.status,
      statusText: response.statusText,
      url: `${QPAY_API_URL}/auth/token`,
      error: errorText,
    })
    throw new Error(`Failed to get QPay access token: ${response.statusText} - ${errorText}`)
  }

  const data: QPayTokenResponse = await response.json()

  // Cache token (subtract 60 seconds for safety margin)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

export async function createQPayInvoice(params: {
  orderNumber: string
  customerPhone: string
  amount: number
  description: string
}): Promise<QPayInvoiceResponse> {
  // Mock mode for development
  if (QPAY_MOCK_MODE) {
    console.log('🎭 QPay Mock Mode: Creating fake invoice', params)
    return {
      invoice_id: `MOCK_${Date.now()}`,
      qr_text: `https://qpay.mn/pay/${params.orderNumber}`,
      qr_image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 transparent PNG
      urls: [
        { name: 'Khan Bank', description: 'Khan Bank Mobile App', link: '#', logo: '' },
        { name: 'TDB', description: 'TDB Mobile App', link: '#', logo: '' },
        { name: 'Golomt Bank', description: 'Golomt Mobile App', link: '#', logo: '' },
      ],
    }
  }

  try {
    const token = await getAccessToken()

    const requestBody = {
      invoice_code: QPAY_INVOICE_CODE,
      sender_invoice_no: params.orderNumber,
      invoice_receiver_code: QPAY_RECEIVER_CODE,
      invoice_description: params.description,
      amount: Math.round(params.amount),
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
    }

    const response = await fetch(`${QPAY_API_URL}/invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = errorText
      }
      
      console.error('QPay invoice creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails,
        orderNumber: params.orderNumber,
      })
      
      throw new Error(`Failed to create QPay invoice: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error('QPay invoice error:', error.message)
    throw error
  }
}

export async function checkPaymentStatus(invoiceId: string): Promise<any> {
  try {
    const token = await getAccessToken()

    const response = await fetch(`${QPAY_API_URL}/payment/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object_type: 'INVOICE',
        object_id: invoiceId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('QPay payment check failed:', {
        status: response.status,
        invoiceId,
        error: errorText,
      })
      throw new Error(`Failed to check payment status: ${response.statusText}`)
    }

    return response.json()
  } catch (error: any) {
    console.error('QPay payment check error:', error.message)
    throw error
  }
}
