'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DeliveryToggleProps {
  orderId: string
  orderNumber: string
  customerPhone: string
  isDelivered: boolean
  paymentStatus: string
}

export function DeliveryToggle({
  orderId,
  orderNumber,
  customerPhone,
  isDelivered,
  paymentStatus,
}: DeliveryToggleProps) {
  const [delivered, setDelivered] = useState(isDelivered)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (paymentStatus !== 'PAID') {
      toast.error('Төлбөр төлөгдөөгүй захиалгыг хүргэсэн гэж тэмдэглэх боломжгүй')
      return
    }

    if (delivered) {
      toast.error('Хүргэгдсэн захиалгыг буцаах боломжгүй')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/orders/mark-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderNumber,
          customerPhone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark as delivered')
      }

      setDelivered(true)
      toast.success('Захиалга хүргэгдсэн гэж тэмдэглэгдлээ. SMS илгээгдлээ.')
    } catch (error: any) {
      console.error('Delivery toggle error:', error)
      toast.error(error.message || 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant={delivered ? 'outline' : 'default'}
      onClick={handleToggle}
      disabled={loading || delivered}
    >
      {delivered ? '✓ Хүргэгдсэн' : 'Хүргэсэн'}
    </Button>
  )
}
