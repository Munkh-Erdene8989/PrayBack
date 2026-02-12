import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirmationSMS } from '@/lib/sms/callpro'

// GET endpoint for webhook verification
export async function GET() {
  console.log('🔔 [WEBHOOK] GET request received - webhook endpoint is alive')
  return NextResponse.json({ 
    status: 'ok',
    message: 'QPay webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log full payload for debugging
    console.log('🔔 [WEBHOOK] QPay webhook received - FULL PAYLOAD:', JSON.stringify(body, null, 2))
    
    console.log('🔔 [WEBHOOK] QPay webhook parsed:', {
      object_id: body.object_id,
      object_type: body.object_type,
      payment_status: body.payment_status,
      payment_id: body.payment_id,
      timestamp: new Date().toISOString(),
    })
    
    // QPay webhook payload
    const { object_id, object_type, payment_status, payment_id } = body

    if (object_type !== 'INVOICE' || payment_status !== 'PAID') {
      console.log('⏭️  [WEBHOOK] Skipping - not a paid invoice')
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
      console.error('❌ [WEBHOOK] Order not found for invoice:', object_id, error)
      return NextResponse.json({ received: true, error: 'Order not found' })
    }

    console.log('✅ [WEBHOOK] Found order:', {
      orderId: order.id,
      orderNumber: order.order_number,
      customerPhone: order.customer_phone,
    })

    // Update order payment status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        payment_id: payment_id,
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('❌ [WEBHOOK] Failed to update order:', updateError)
      return NextResponse.json({ received: true, error: 'Update failed' })
    }

    console.log('💾 [WEBHOOK] Order updated to PAID')

    // Send confirmation SMS
    try {
      await sendOrderConfirmationSMS(order.customer_phone, order.order_number)
      console.log('📱 [WEBHOOK] SMS sent successfully')
    } catch (smsError) {
      console.error('❌ [WEBHOOK] SMS failed:', smsError)
      // Don't fail the webhook if SMS fails
    }

    console.log('🎉 [WEBHOOK] Webhook processed successfully')
    return NextResponse.json({ 
      received: true, 
      updated: true,
      order_number: order.order_number 
    })
  } catch (error) {
    console.error('❌ [WEBHOOK] Webhook error:', error)
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }
}
