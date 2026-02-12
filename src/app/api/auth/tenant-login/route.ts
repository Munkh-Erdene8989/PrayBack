import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/tenant-auth'
import { createTenantSession } from '@/lib/auth/tenant-auth'
import { z } from 'zod'

const tenantLoginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantSlug: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, tenantSlug } = tenantLoginSchema.parse(body)

    const supabase = await createAdminClient()

    // Build query based on whether we have tenant slug
    let query = supabase
      .from('tenants')
      .select('*')
      .eq('admin_username', username)
      .eq('is_active', true)

    if (tenantSlug) {
      query = query.eq('slug', tenantSlug)
    }

    const { data: tenant, error } = await query.single()

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, tenant.admin_password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create tenant session
    await createTenantSession({
      tenantId: tenant.id,
      username: tenant.admin_username,
      role: 'tenant_admin',
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    })
  } catch (error) {
    console.error('Tenant login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
