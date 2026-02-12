import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms/callpro'

const mockCompleteSchema = z.object({
  orderId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = mockCompleteSchema.parse(body)

    const supabase = await createAdminClient()

    // Get order
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

    // Update order status to PAID
    await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        payment_id: `MOCK_PAYMENT_${Date.now()}`,
      })
      .eq('id', orderId)

    // Send SMS confirmation
    const smsMessage = SMS_TEMPLATES.ORDER_CONFIRMED(order.order_number)
    await sendSMS({
      to: order.customer_phone,
      message: smsMessage,
    })

    return NextResponse.json({
      success: true,
      message: 'Payment completed (mock mode)',
    })
  } catch (error: any) {
    console.error('Mock complete payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete payment' },
      { status: 500 }
    )
  }
}
