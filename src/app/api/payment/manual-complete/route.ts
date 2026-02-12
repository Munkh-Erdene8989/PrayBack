import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms/callpro'
import { z } from 'zod'

const manualCompleteSchema = z.object({
  orderId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = manualCompleteSchema.parse(body)

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
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        payment_id: `MANUAL_${Date.now()}`,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Update order error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // Send SMS confirmation
    console.log('Sending SMS to:', order.customer_phone)
    const smsMessage = SMS_TEMPLATES.ORDER_CONFIRMED(order.order_number)
    
    const smsResult = await sendSMS({
      to: order.customer_phone,
      message: smsMessage,
    })

    console.log('SMS sent result:', smsResult)

    return NextResponse.json({
      success: true,
      message: 'Payment completed manually',
      order_number: order.order_number,
      sms_sent: smsResult,
    })
  } catch (error: any) {
    console.error('Manual complete payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete payment' },
      { status: 500 }
    )
  }
}
