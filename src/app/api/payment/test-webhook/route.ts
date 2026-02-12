import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Test endpoint to simulate QPay webhook
 * Usage: POST /api/payment/test-webhook with { orderId: "uuid" }
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test webhook only available in development' },
      { status: 403 }
    )
  }

  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Simulate QPay webhook payload
    const webhookPayload = {
      object_id: order.qpay_invoice_id,
      object_type: 'INVOICE',
      payment_status: 'PAID',
      payment_id: `TEST_${Date.now()}`,
      payment_date: new Date().toISOString(),
      payment_amount: order.total_amount,
      payment_currency: 'MNT',
    }

    console.log('🧪 [TEST-WEBHOOK] Simulating QPay webhook:', webhookPayload)

    // Call the actual webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent',
      webhookPayload,
      webhookResponse: result,
    })
  } catch (error) {
    console.error('❌ [TEST-WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: 'Test webhook failed' },
      { status: 500 }
    )
  }
}
