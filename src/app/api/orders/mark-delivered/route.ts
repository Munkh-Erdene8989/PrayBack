import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderDeliveredSMS } from '@/lib/sms/callpro'
import { z } from 'zod'

const markDeliveredSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  customerPhone: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, orderNumber, customerPhone } = markDeliveredSchema.parse(body)

    const supabase = await createAdminClient()

    // Update order status
    const { error } = await supabase
      .from('orders')
      .update({
        delivery_status: 'DELIVERED',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      console.error('Update delivery status error:', error)
      return NextResponse.json(
        { error: 'Failed to update delivery status' },
        { status: 500 }
      )
    }

    // Send SMS notification
    await sendOrderDeliveredSMS(customerPhone, orderNumber)

    return NextResponse.json({
      success: true,
      message: 'Order marked as delivered and SMS sent',
    })
  } catch (error) {
    console.error('Mark delivered error:', error)
    return NextResponse.json(
      { error: 'Failed to mark as delivered' },
      { status: 500 }
    )
  }
}
