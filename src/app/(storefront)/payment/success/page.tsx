'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle, Home, ShoppingBag } from 'lucide-react'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-20 w-20 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">
                Төлбөр амжилттай төлөгдлөө! 🎉
              </h1>
              <p className="text-base text-muted-foreground">
                Таны захиалга баталгаажлаа
              </p>
            </div>

            {orderNumber && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Захиалгын дугаар:
                </p>
                <p className="text-lg font-mono font-bold">
                  {orderNumber}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📱 SMS мэдэгдлийг таны утас руу илгээлээ.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Захиалга удахгүй хүргэгдэх болно.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link href="/" className="w-full">
                <Button className="w-full" size="lg">
                  <Home className="mr-2 h-4 w-4" />
                  Нүүр хуудас руу буцах
                </Button>
              </Link>
              <Link href="/books" className="w-full">
                <Button variant="outline" className="w-full" size="lg">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Дахин худалдан авах
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Ачаалж байна...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
