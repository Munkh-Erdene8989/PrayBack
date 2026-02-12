import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, slug, contact_phone, contact_email')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Tenants fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Tenants API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}
