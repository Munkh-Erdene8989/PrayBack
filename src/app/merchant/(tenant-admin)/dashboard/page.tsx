import { createAdminClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

import { getTenantSession } from '@/lib/auth/tenant-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

export default async function TenantDashboardPage() {
  const session = await getTenantSession()
  
  if (!session) {
    redirect('/merchant/login')
  }

  const supabase = await createAdminClient()
  const tenantId = session.tenantId

  // Get today's and yesterday's dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Fetch today's sales
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('tenant_id', tenantId)
    .eq('payment_status', 'PAID')
    .gte('created_at', today.toISOString())

  const todaySales = todayOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

  // Fetch yesterday's sales
  const { data: yesterdayOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('tenant_id', tenantId)
    .eq('payment_status', 'PAID')
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString())

  const yesterdaySales = yesterdayOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

  // Calculate growth
  const growth = yesterdaySales > 0 
    ? ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1)
    : 0

  // Order status counts
  const [
    { count: pendingCount },
    { count: processingCount },
    { count: deliveredCount },
    { count: cancelledCount },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('delivery_status', 'PENDING'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('delivery_status', 'PROCESSING'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('delivery_status', 'DELIVERED'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('delivery_status', 'CANCELLED'),
  ])

  // Top selling books
  const { data: topBooks } = await supabase
    .from('order_items')
    .select(`
      book_id,
      quantity,
      books (title, price),
      orders!inner (tenant_id, payment_status)
    `)
    .eq('orders.tenant_id', tenantId)
    .eq('orders.payment_status', 'PAID')
    .limit(5)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todaySales.toLocaleString()}₮</p>
            <p className="text-sm text-muted-foreground mt-2">
              {Number(growth) >= 0 ? '+' : ''}{growth}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yesterday's Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{yesterdaySales.toLocaleString()}₮</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{pendingCount || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Processing</p>
            <p className="text-2xl font-bold">{processingCount || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{deliveredCount || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{cancelledCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Books */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Books</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topBooks?.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.books?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} sold
                  </p>
                </div>
                <p className="font-bold">{item.books?.price.toLocaleString()}₮</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
