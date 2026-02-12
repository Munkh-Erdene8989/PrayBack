import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const checkStatusSchema = z.object({
  orderId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = checkStatusSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }
    
    const { orderId } = validation.data

    const supabase = await createAdminClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('payment_status, delivery_status, order_number')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      console.log('[DEBUG] Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('[DEBUG] Check status result:', {
      orderId,
      payment_status: order.payment_status,
      order_number: order.order_number,
    })

    return NextResponse.json({
      payment_status: order.payment_status,
      delivery_status: order.delivery_status,
      order_number: order.order_number,
    })
  } catch (error) {
    console.error('Check status error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
