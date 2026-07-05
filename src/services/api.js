// Thin wrapper around our own /api/* serverless functions.
// On 401 the caller should send the user to sign-in (SIWE arrives in Phase 2).
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  let body = null
  try {
    body = await res.json()
  } catch {
    // non-JSON response (e.g. dev server without /api routes)
  }

  if (res.status === 401) {
    throw new ApiError('Sign in required', 401)
  }
  if (!res.ok) {
    const message =
      (body && body.error) ||
      (res.status === 404
        ? 'API route not found. In local dev run "npm run cf:dev" (wrangler pages dev) to serve /api functions.'
        : `Request failed (${res.status})`)
    throw new ApiError(message, res.status)
  }
  return body
}
