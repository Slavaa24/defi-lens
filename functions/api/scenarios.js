import { getDb, unwrap } from './_lib/db.js'
import { getSession, unauthorized } from './_lib/auth.js'
import { json, readJson, methodNotAllowed } from './_lib/respond.js'

// Saved IL-calculator scenarios. `params` mirrors the calculator's URL params.
const ALLOWED_KEYS = ['ta', 'tas', 'tb', 'tbs', 'amt', 'da', 'db', 'apy', 'days']
const MAX_NAME = 60
const MAX_VALUE = 80
const MAX_SCENARIOS = 50
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sanitizeParams(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const params = {}
  for (const key of ALLOWED_KEYS) {
    if (raw[key] != null) {
      const value = String(raw[key]).slice(0, MAX_VALUE)
      if (value !== '') params[key] = value
    }
  }
  return Object.keys(params).length > 0 ? params : null
}

async function listScenarios(db, userId) {
  return unwrap(
    await db
      .from('calc_scenarios')
      .select('id, name, params, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    'list scenarios'
  )
}

export async function onRequest({ request, env }) {
  const session = await getSession(request, env)
  if (!session) return unauthorized()

  try {
    const db = getDb(env)

    if (request.method === 'GET') {
      return json({ scenarios: await listScenarios(db, session.userId) })
    }

    // POST { name, params } — create or overwrite the scenario with that name.
    if (request.method === 'POST') {
      const body = (await readJson(request)) || {}
      const name = String(body.name || '').trim().slice(0, MAX_NAME)
      const params = sanitizeParams(body.params)
      if (!name) return json({ error: 'Scenario name is required.' }, 400)
      if (!params) return json({ error: 'Scenario has no values to save.' }, 400)

      const { count } = await db
        .from('calc_scenarios')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.userId)
        .neq('name', name)
      if ((count ?? 0) >= MAX_SCENARIOS) {
        return json({ error: `You can save up to ${MAX_SCENARIOS} scenarios. Delete one first.` }, 400)
      }

      unwrap(
        await db
          .from('calc_scenarios')
          .upsert(
            { user_id: session.userId, name, params, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,name' }
          ),
        'save scenario'
      )
      return json({ scenarios: await listScenarios(db, session.userId) }, 201)
    }

    if (request.method === 'DELETE') {
      const id = String(new URL(request.url).searchParams.get('id') || '').trim()
      if (!UUID_RE.test(id)) return json({ error: 'Scenario id is required.' }, 400)
      unwrap(
        await db.from('calc_scenarios').delete().eq('id', id).eq('user_id', session.userId),
        'delete scenario'
      )
      return json({ scenarios: await listScenarios(db, session.userId) })
    }

    return methodNotAllowed()
  } catch (err) {
    console.error('scenarios error:', err.message)
    return json({ error: err.status ? err.message : 'Scenario operation failed.' }, err.status || 500)
  }
}
