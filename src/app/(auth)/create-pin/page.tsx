'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function CreatePINForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const phone = searchParams.get('phone')
  
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || !phone) {
      router.push('/login')
    }
  }, [userId, phone, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin.length !== 6) {
      toast.error('PIN код 6 оронтой байх ёстой')
      return
    }

    if (pin !== confirmPin) {
      toast.error('PIN код таарахгүй байна')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/create-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create PIN')
      }

      toast.success('PIN амжилттай үүслээ')
      router.push('/')
    } catch (error: any) {
      console.error('Create PIN error:', error)
      toast.error(error.message || 'PIN үүсгэхэд алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PIN үүсгэх</CardTitle>
          <CardDescription>
            6 оронтой PIN кодоо үүсгэнэ үү
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
            <div className="space-y-2">
              <Label htmlFor="confirmPin">PIN код давтах</Label>
              <Input
                id="confirmPin"
                type="password"
                placeholder="••••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Үүсгэж байна...' : 'PIN үүсгэх'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CreatePINPage() {
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
      <CreatePINForm />
    </Suspense>
  )
}
