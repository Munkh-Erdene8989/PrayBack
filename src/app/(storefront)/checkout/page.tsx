'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tenant } from '@/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    tenant_id: '',
    delivery_address: '',
    delivery_note: '',
  })

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
      return
    }
    fetchTenants()
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({
          ...prev,
          customer_phone: data.user.phone,
        }))
      } else {
        // User not logged in, redirect to login
        toast.error('Захиалга үүсгэхийн тулд нэвтэрнэ үү')
        router.push('/login')
      }
    } catch (error) {
      toast.error('Нэвтрэх шаардлагатай')
      router.push('/login')
    }
  }

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants')
      const data = await res.json()
      setTenants(data.tenants || [])
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
      toast.error('Нийлүүлэгчдийг татахад алдаа гарлаа')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.tenant_id) {
        toast.error('Нийлүүлэгч сонгоно уу')
        setLoading(false)
        return
      }

      // Create order
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            book_id: item.book.id,
            quantity: item.quantity,
            unit_price: item.book.price,
          })),
          subtotal: getTotalPrice(),
          total_amount: getTotalPrice(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      toast.success('Захиалга амжилттай үүслээ')
      
      // Clear cart
      clearCart()

      // Redirect to payment
      router.push(`/payment/${data.orderId}`)
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Захиалга үүсгэхэд алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Төлбөр төлөх</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Хүргэлтийн мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Нэр *</Label>
                  <Input
                    id="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Утас *</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant_id">Нийлүүлэгч сонгох *</Label>
                  <select
                    id="tenant_id"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  >
                    <option value="">Нийлүүлэгч сонгох</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_address">Хүргэлтийн хаяг *</Label>
                  <textarea
                    id="delivery_address"
                    required
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_note">Нэмэлт тайлбар</Label>
                  <textarea
                    id="delivery_note"
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.delivery_note}
                    onChange={(e) => setFormData({ ...formData, delivery_note: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Захиалж байна...' : 'Захиалах'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Захиалгын дүн</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.book.id} className="flex justify-between text-sm">
                  <span>
                    {item.book.title} x {item.quantity}
                  </span>
                  <span>{(item.book.price * item.quantity).toLocaleString()}₮</span>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Нийт:</span>
                  <span className="text-primary">
                    {getTotalPrice().toLocaleString()}₮
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
