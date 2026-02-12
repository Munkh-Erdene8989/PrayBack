import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createQPayInvoice } from '@/lib/payment/qpay'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  orderId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = createInvoiceSchema.parse(body)

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

    // Create QPay invoice
    const invoice = await createQPayInvoice({
      orderNumber: order.order_number,
      customerPhone: order.customer_phone,
      amount: order.total_amount,
      description: `Номын захиалга #${order.order_number}`,
    })

    // Update order with invoice ID
    await supabase
      .from('orders')
      .update({
        qpay_invoice_id: invoice.invoice_id,
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: any) {
    console.error('Create invoice error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
