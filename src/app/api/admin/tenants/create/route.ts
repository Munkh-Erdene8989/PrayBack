import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/tenant-auth'
import { z } from 'zod'

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  admin_username: z.string().min(3),
  admin_password: z.string().min(6),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantData = createTenantSchema.parse(body)

    const supabase = await createAdminClient()

    // Hash password
    const passwordHash = await hashPassword(tenantData.admin_password)

    // Create tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        name: tenantData.name,
        slug: tenantData.slug,
        admin_username: tenantData.admin_username,
        admin_password_hash: passwordHash,
        contact_phone: tenantData.contact_phone,
        contact_email: tenantData.contact_email,
      })
      .select()
      .single()

    if (error) {
      console.error('Tenant creation error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tenant,
    })
  } catch (error: any) {
    console.error('Create tenant error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
