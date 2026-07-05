import { createClient } from '@supabase/supabase-js'

// Service-role client — server-side only. Never import from /src.
let client = null

export function getDb() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    const err = new Error('Server is not configured (missing Supabase credentials).')
    err.status = 503
    throw err
  }
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
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
