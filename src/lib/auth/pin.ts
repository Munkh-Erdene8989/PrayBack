import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export function validatePin(pin: string): boolean {
  // PIN must be 6 digits
  return /^\d{6}$/.test(pin)
}
