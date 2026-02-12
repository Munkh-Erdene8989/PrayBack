'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { QPayInvoiceResponse } from '@/types'
import { CheckCircle } from 'lucide-react'

export default function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const router = useRouter()
  const { orderId } = use(params)
  const [invoice, setInvoice] = useState<QPayInvoiceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    createInvoice()
    
    // Poll for payment status every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000)
    return () => clearInterval(interval)
  }, [orderId])

  const createInvoice = async () => {
    try {
      const res = await fetch('/api/payment/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invoice')
      }

      setInvoice(data.invoice)
    } catch (error: any) {
      console.error('Invoice creation error:', error)
      toast.error(error.message || 'Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (checking) return
    setChecking(true)

    try {
      const res = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      const data = await res.json()

      if (data.payment_status === 'PAID') {
        setOrderNumber(data.order_number)
        setSuccessModalOpen(true)
      }
    } catch (error) {
      console.error('Status check error:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleManualComplete = async () => {
    if (!confirm('Төлбөр төлсөн төлөвт шилжүүлж, SMS илгээх үү?')) return
    
    try {
      const res = await fetch('/api/payment/manual-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setOrderNumber(data.order_number)
        setSuccessModalOpen(true)
        toast.success('Төлбөр баталгаажлаа! SMS илгээгдлээ.')
      } else {
        toast.error(data.error || 'Алдаа гарлаа')
      }
    } catch (error) {
      toast.error('Алдаа гарлаа')
    }
  }

  const isMockMode = process.env.NEXT_PUBLIC_QPAY_MOCK_MODE === 'true' || invoice?.invoice_id?.startsWith('MOCK_')

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Төлбөрийн мэдээлэл бэлтгэж байна...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">Төлбөрийн мэдээлэл олдсонгүй</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Нүүр хуудас руу буцах
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Төлбөр төлөх
              {isMockMode && <span className="text-sm text-orange-600 ml-2">(Test Mode)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Development Mode Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                💡 Development Mode
              </p>
              <p className="text-xs text-blue-600 mb-2">
                Localhost дээр QPay webhook ирж чадахгүй. Төлбөр төлсний дараа доорх товчоор manual баталгаажуулна уу.
              </p>
            </div>
            {/* QR Code */}
            <div className="flex justify-center">
              {invoice.qr_image ? (
                <img
                  src={`data:image/png;base64,${invoice.qr_image}`}
                  alt="QPay QR Code"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                  QR Code
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                QPay-аар төлөх бол дээрх QR кодыг уншуулна уу
              </p>
              <p className="text-xs text-muted-foreground">
                Төлбөр төлсний дараа автоматаар шалгагдана
              </p>
            </div>

            {/* Bank App Links */}
            {invoice.urls && invoice.urls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">
                  Эсвэл банкны апп сонгох:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {invoice.urls.map((url, index) => (
                    <a
                      key={index}
                      href={url.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border rounded hover:bg-accent text-center text-sm"
                    >
                      {url.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Complete Button (Development) */}
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleManualComplete}
            >
              ✅ Төлбөр Төлсөн (Manual Confirm + SMS)
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Болих
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <DialogTitle className="text-2xl text-center">
              Төлбөр амжилттай төлөгдлөө! 🎉
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="space-y-3">
                <div className="text-base text-foreground">
                  Таны захиалга баталгаажлаа.
                </div>
                {orderNumber && (
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                    Захиалгын дугаар: <strong>{orderNumber}</strong>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  SMS мэдэгдлийг таны утас руу илгээлээ.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              className="w-full"
              onClick={() => {
                setSuccessModalOpen(false)
                router.push('/')
              }}
            >
              Нүүр хуудас руу буцах
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => {
                setSuccessModalOpen(false)
                router.push('/books')
              }}
            >
              Дахин худалдан авах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
