import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  user_id: string;
  role: string;
  tenant_id: string | null;
  phone: string;
}

/**
 * Sign a custom JWT containing user claims.
 * Used after successful OTP verification.
 */
export function signJwt(payload: JwtPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "bookstore-saas",
    subject: payload.user_id,
  });
}

/**
 * Verify and decode a custom JWT.
 * Returns the decoded payload or null if invalid/expired.
 */
export function verifyJwt(token: string): JwtPayload | null {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "bookstore-saas",
    }) as jwt.JwtPayload & JwtPayload;

    return {
      user_id: decoded.user_id,
      role: decoded.role,
      tenant_id: decoded.tenant_id,
      phone: decoded.phone,
    };
  } catch {
    return null;
  }
}
