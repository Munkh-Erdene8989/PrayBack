'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone')
  
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!phone) {
      router.push('/login')
    }
  }, [phone, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error('OTP код 6 оронтой байх ёстой')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      toast.success('Баталгаажуулалт амжилттай')

      if (data.hasPin) {
        // User has PIN, redirect to home
        router.push('/')
      } else {
        // User doesn't have PIN, redirect to create PIN
        router.push(`/create-pin?userId=${data.userId}&phone=${encodeURIComponent(phone || '')}`)
      }
    } catch (error: any) {
      console.error('OTP verification error:', error)
      toast.error(error.message || 'OTP код буруу байна')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (!res.ok) {
        throw new Error('Failed to resend OTP')
      }

      toast.success('OTP код дахин илгээгдлээ')
    } catch (error) {
      toast.error('OTP дахин илгээхэд алдаа гарлаа')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OTP баталгаажуулалт</CardTitle>
          <CardDescription>
            {phone} дугаар руу илгээсэн OTP кодоо оруулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP код</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Баталгаажуулж байна...' : 'Баталгаажуулах'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={loading}
            >
              OTP дахин илгээх
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
