import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth/session'
import { deleteTenantSession } from '@/lib/auth/tenant-auth'

export async function POST(request: NextRequest) {
  try {
    // Delete both customer and tenant sessions
    await deleteSession()
    await deleteTenantSession()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
