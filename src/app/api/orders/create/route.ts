import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createOrderSchema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().min(8),
  tenant_id: z.string().uuid(),
  delivery_address: z.string().min(1),
  delivery_note: z.string().optional(),
  items: z.array(z.object({
    book_id: z.string().uuid(),
    quantity: z.number().positive().int(),
    unit_price: z.number().positive(),
  })),
  subtotal: z.number().positive(),
  total_amount: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Clean phone number (remove spaces, dashes, etc.)
    if (body.customer_phone) {
      body.customer_phone = body.customer_phone.replace(/\D/g, '')
    }
    
    const validation = createOrderSchema.safeParse(body)
    
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(err => {
        if (err.path[0] === 'customer_phone') {
          return 'Утасны дугаар 8 оронтой байх ёстой'
        }
        return err.message
      })
      return NextResponse.json(
        { error: errorMessages[0] || 'Мэдээлэл буруу байна' },
        { status: 400 }
      )
    }
    
    const orderData = validation.data

    const supabase = await createAdminClient()

    // Generate order number
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        tenant_id: orderData.tenant_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address,
        delivery_note: orderData.delivery_note,
        subtotal: orderData.subtotal,
        total_amount: orderData.total_amount,
        payment_status: 'PENDING',
        delivery_status: 'PENDING',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      book_id: item.book_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
