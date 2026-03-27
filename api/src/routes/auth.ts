// api/src/middleware/auth.ts
import { Context, Next } from 'hono'
import * as jose from 'jose'

interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  iat: number
  exp: number
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.slice(7) // Remove "Bearer " prefix

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET)
    const verified = await jose.jwtVerify(token, secret)
    
    const payload = verified.payload as unknown as JWTPayload

    // Attach user context to request
    c.set('userId', payload.userId)
    c.set('tenantId', payload.tenantId)
    c.set('email', payload.email)

    await next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

/**
 * Helper to generate JWT token
 */
export async function generateJWT(
  userId: string,
  tenantId: string,
  email: string,
  secret: string,
  expiresIn: string = '7d'
): Promise<string> {
  const alg = 'HS256'
  const secretBytes = new TextEncoder().encode(secret)

  const token = await jose.SignJWT({
    userId,
    tenantId,
    email,
  })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretBytes)

  return token
}

/**
 * Helper to verify and decode JWT
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const secretBytes = new TextEncoder().encode(secret)
  const verified = await jose.jwtVerify(token, secretBytes)
  return verified.payload as unknown as JWTPayload
}
