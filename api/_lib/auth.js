import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'dl_session'
const SESSION_DAYS = 7

function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    const err = new Error('Server is not configured (missing JWT secret).')
    err.status = 503
    throw err
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken({ userId, address }) {
  return new SignJWT({ address })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey())
}

export function sessionCookie(token) {
  const base = `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DAYS * 86400}; SameSite=Lax`
  return process.env.VERCEL_ENV ? `${base}; Secure` : base
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}

function readCookie(req) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) return rest.join('=')
  }
  return null
}

// Returns { userId, address } or null. Never throws on bad/expired tokens.
export async function getSession(req) {
  const token = readCookie(req)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (!payload.sub || !payload.address) return null
    return { userId: payload.sub, address: payload.address }
  } catch {
    return null
  }
}

// Guard for protected routes: sends 401 and returns null when unauthenticated.
export async function requireSession(req, res) {
  const session = await getSession(req)
  if (!session) {
    res.status(401).json({ error: 'Sign in required' })
    return null
  }
  return session
}
