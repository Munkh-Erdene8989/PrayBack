'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              ✓ Төлбөр амжилттай
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {orderNumber && (
              <p className="text-lg">
                Захиалгын дугаар: <strong>{orderNumber}</strong>
              </p>
            )}
            <p className="text-muted-foreground">
              Таны захиалга амжилттай баталгаажлаа. Удахгүй хүргэгдэх болно.
            </p>
            <Link href="/">
              <Button className="w-full">Нүүр хуудас руу буцах</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
