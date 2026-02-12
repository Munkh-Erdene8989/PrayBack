import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const sendOTPSchema = z.object({
  phone: z.string().min(8, 'Phone number is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = sendOTPSchema.parse(body)

    const supabase = await createAdminClient()

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP in database
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5) // 5 minutes expiry

    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        phone: phone,
        code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false,
      })

    if (otpError) {
      console.error('OTP storage error:', otpError)
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      )
    }

    // Send OTP via CallPro SMS
    const { sendSMS } = await import('@/lib/sms/callpro')
    const smsSent = await sendSMS({
      to: phone,
      message: `Таны OTP код: ${otp}. 5 минутын дотор хүчинтэй.`,
    })

    if (!smsSent) {
      console.error('SMS send failed')
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
