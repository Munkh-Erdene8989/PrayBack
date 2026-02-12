import { NextResponse } from 'next/server'

const QPAY_API_URL = process.env.QPAY_API_URL || 'https://merchant-sandbox.qpay.mn/v2'
const QPAY_CLIENT_ID = process.env.QPAY_CLIENT_ID!
const QPAY_CLIENT_SECRET = process.env.QPAY_CLIENT_SECRET!

export async function GET() {
  try {
    console.log('🧪 Testing QPay credentials...')
    console.log('API URL:', QPAY_API_URL)
    console.log('Client ID:', QPAY_CLIENT_ID?.substring(0, 5) + '...')

    // Test authentication
    const credentials = Buffer.from(`${QPAY_CLIENT_ID}:${QPAY_CLIENT_SECRET}`).toString('base64')

    const response = await fetch(`${QPAY_API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    if (!response.ok) {
      console.error('❌ QPay auth failed:', {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
      })
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        status: response.status,
        statusText: response.statusText,
        details: responseData,
      }, { status: 500 })
    }

    console.log('✅ QPay auth successful!')

    return NextResponse.json({
      success: true,
      message: 'QPay credentials are valid',
      token_expires_in: responseData.expires_in,
      api_url: QPAY_API_URL,
    })
  } catch (error: any) {
    console.error('❌ QPay test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
