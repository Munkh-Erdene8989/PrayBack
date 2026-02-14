import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/tenant-auth'
import { z } from 'zod'

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  admin_username: z.string().min(3).optional(),
  admin_password: z.string().min(6).optional(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  is_active: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug, admin_username, contact_phone, contact_email, is_active, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tenant })
  } catch (error) {
    console.error('Get tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updates = updateTenantSchema.parse(body)

    const supabase = await createAdminClient()

    const payload: Record<string, unknown> = {
      name: updates.name,
      slug: updates.slug,
      admin_username: updates.admin_username,
      contact_phone: updates.contact_phone ?? null,
      contact_email: updates.contact_email ?? null,
      is_active: updates.is_active,
    }

    if (updates.admin_password) {
      payload.admin_password_hash = await hashPassword(updates.admin_password)
    }

    // Remove undefined keys
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key]
    })

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Tenant update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, tenant })
  } catch (error: any) {
    console.error('Update tenant error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update tenant' },
      { status: 500 }
    )
  }
}
