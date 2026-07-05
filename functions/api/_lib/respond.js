// Fetch-API helpers for Cloudflare Pages Functions handlers.
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

// Parse a JSON request body; returns null on empty/invalid bodies.
export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function methodNotAllowed() {
  return json({ error: 'Method not allowed' }, 405)
}
