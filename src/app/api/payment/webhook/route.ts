import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirmationSMS } from '@/lib/sms/callpro'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // QPay webhook payload
    const { object_id, object_type, payment_status, payment_id } = body

    if (object_type !== 'INVOICE' || payment_status !== 'PAID') {
      return NextResponse.json({ received: true })
    }

    const supabase = await createAdminClient()

    // Find order by invoice ID
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('qpay_invoice_id', object_id)
      .single()

    if (error || !order) {
      console.error('Order not found for invoice:', object_id)
      return NextResponse.json({ received: true })
    }

    // Update order payment status
    await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        payment_id: payment_id,
      })
      .eq('id', order.id)

    // Send confirmation SMS
    await sendOrderConfirmationSMS(order.customer_phone, order.order_number)

    return NextResponse.json({ received: true, updated: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }
}
