import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-change-in-production'
)

const TENANT_SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

export interface TenantSessionData {
  tenantId: string
  username: string
  role: 'tenant_admin'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createTenantSession(data: TenantSessionData): Promise<string> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SESSION_SECRET)

  const cookieStore = await cookies()
  cookieStore.set('tenant_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TENANT_SESSION_DURATION / 1000,
    path: '/',
  })

  return token
}

export async function getTenantSession(): Promise<TenantSessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('tenant_session')?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    return payload as unknown as TenantSessionData
  } catch {
    return null
  }
}

export async function deleteTenantSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('tenant_session')
}
