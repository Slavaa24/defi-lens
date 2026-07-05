import { clearSessionCookie } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/respond.js'

export async function onRequest({ request }) {
  if (request.method !== 'POST') return methodNotAllowed()
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() })
}
