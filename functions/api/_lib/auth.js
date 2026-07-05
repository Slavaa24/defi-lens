import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'dl_session'
const SESSION_DAYS = 7

function secretKey(env) {
  const secret = env.JWT_SECRET
  if (!secret) {
    const err = new Error('Server is not configured (missing JWT secret).')
    err.status = 503
    throw err
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(env, { userId, address }) {
  return new SignJWT({ address })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey(env))
}

// Secure only over https so the cookie survives `wrangler pages dev` (plain http).
export function sessionCookie(token, request) {
  const base = `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DAYS * 86400}; SameSite=Lax`
  return new URL(request.url).protocol === 'https:' ? `${base}; Secure` : base
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}

function readCookie(request) {
  const header = request.headers.get('cookie') || ''
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) return rest.join('=')
  }
  return null
}

// Returns { userId, address } or null. Never throws on bad/expired tokens.
export async function getSession(request, env) {
  const token = readCookie(request)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(env))
    if (!payload.sub || !payload.address) return null
    return { userId: payload.sub, address: payload.address }
  } catch {
    return null
  }
}

// 401 body for protected routes when getSession() returns null.
export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Sign in required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
