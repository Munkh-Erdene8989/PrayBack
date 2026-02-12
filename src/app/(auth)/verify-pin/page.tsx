'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function VerifyPINForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone')
  
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!phone) {
      router.push('/login')
    }
  }, [phone, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin.length !== 6) {
      toast.error('PIN код 6 оронтой байх ёстой')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      toast.success('Амжилттай нэвтэрлээ')
      router.push('/')
    } catch (error: any) {
      console.error('PIN verification error:', error)
      toast.error(error.message || 'PIN код буруу байна')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PIN оруулах</CardTitle>
          <CardDescription>
            Таны 6 оронтой PIN кодоо оруулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN код</Label>
              <Input
                id="pin"
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Буцах
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPINPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ачаалж байна...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyPINForm />
    </Suspense>
  )
}
