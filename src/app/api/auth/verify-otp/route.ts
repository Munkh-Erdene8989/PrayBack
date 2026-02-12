import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const verifyOTPSchema = z.object({
  phone: z.string().min(8, 'Phone number is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp } = verifyOTPSchema.parse(body)

    const supabase = await createAdminClient()

    // Verify OTP from database
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    // If user doesn't exist, create it
    if (!user) {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          phone: phone,
          role: 'customer',
        })
        .select()
        .single()

      if (userError) {
        console.error('User creation error:', userError)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }
      user = newUser
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      hasPin: !!user.pin_hash,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
