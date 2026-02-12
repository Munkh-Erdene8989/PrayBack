import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
          }
        }
      )
    }

    return NextResponse.json(
      {
        user: {
          userId: session.userId,
          phone: session.phone,
          role: session.role,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        }
      }
    )
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
