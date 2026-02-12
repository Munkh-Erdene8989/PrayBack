'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if user exists
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const checkData = await checkRes.json()

      if (checkData.exists && checkData.hasPin) {
        // User has PIN, redirect to PIN screen
        router.push(`/verify-pin?phone=${encodeURIComponent(phone)}`)
      } else {
        // User doesn't exist or has no PIN, send OTP
        const otpRes = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        })

        if (!otpRes.ok) {
          throw new Error('Failed to send OTP')
        }

        toast.success('OTP код таны утас руу илгээгдлээ')
        router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Нэвтрэх</CardTitle>
          <CardDescription>
            Утасны дугаараа оруулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Утасны дугаар</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="99119911"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Уншиж байна...' : 'Үргэлжлүүлэх'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
