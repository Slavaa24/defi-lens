import { createClient } from '@supabase/supabase-js'

// Service-role client — server-side only. Never import from /src.
// Cached at module scope: persists across requests within a warm isolate.
let client = null

export function getDb(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    const err = new Error('Server is not configured (missing Supabase credentials).')
    err.status = 503
    throw err
  }
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

// Unwrap a supabase-js response, converting errors to throwables.
export function unwrap({ data, error }, context = 'db query') {
  if (error) {
    const err = new Error(`${context}: ${error.message}`)
    err.code = error.code
    throw err
  }
  return data
}
