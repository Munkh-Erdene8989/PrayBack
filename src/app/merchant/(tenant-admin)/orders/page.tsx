import { createAdminClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

import { getTenantSession } from '@/lib/auth/tenant-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { DeliveryToggle } from '@/components/merchant/DeliveryToggle'

export default async function TenantOrdersPage() {
  const session = await getTenantSession()
  
  if (!session) {
    redirect('/merchant/login')
  }

  const supabase = await createAdminClient()
  const tenantId = session.tenantId

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order #</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">Delivery</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div>{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.customer_phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{order.total_amount.toLocaleString()}₮</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          order.payment_status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          order.delivery_status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.delivery_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <DeliveryToggle 
                        orderId={order.id}
                        orderNumber={order.order_number}
                        customerPhone={order.customer_phone}
                        isDelivered={order.delivery_status === 'DELIVERED'}
                        paymentStatus={order.payment_status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
