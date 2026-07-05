import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useAuth from './useAuth'
import { apiFetch } from '../services/api'

const WATCHLIST_KEY = 'defilens:watchlist'

function loadLocal() {
  try {
    return new Set(JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveLocal(set) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...set]))
}

// Watchlist as a Set of DefiLlama pool ids.
// Signed out: localStorage only. Signed in: the DB is the source of truth;
// the localStorage set is merged into the account on first load and kept as
// a mirror so the list survives signing out. Toggles are optimistic.
export default function useWatchlist() {
  const { isAuthed } = useAuth()
  const queryClient = useQueryClient()
  const [local, setLocal] = useState(loadLocal)

  const remote = useQuery({
    queryKey: ['watchlist'],
    enabled: isAuthed,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const stored = loadLocal()
      const { poolIds } = stored.size
        ? await apiFetch('/api/watchlist', {
            method: 'POST',
            body: JSON.stringify({ poolIds: [...stored] }),
          })
        : await apiFetch('/api/watchlist')
      const merged = new Set(poolIds)
      saveLocal(merged)
      setLocal(merged)
      return merged
    },
  })

  const watchlist = isAuthed && remote.data ? remote.data : local

  const toggle = (poolId) => {
    const had = watchlist.has(poolId)
    const next = new Set(watchlist)
    if (had) next.delete(poolId)
    else next.add(poolId)

    saveLocal(next)
    setLocal(next)

    if (isAuthed) {
      queryClient.setQueryData(['watchlist'], next)
      apiFetch(
        had ? `/api/watchlist?poolId=${encodeURIComponent(poolId)}` : '/api/watchlist',
        had ? { method: 'DELETE' } : { method: 'POST', body: JSON.stringify({ poolIds: [poolId] }) }
      ).catch(() => {
        // server disagreed — refetch the truth rather than guessing
        queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      })
    }
  }

  return { watchlist, toggle }
}
