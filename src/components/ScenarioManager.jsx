import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuth from '../hooks/useAuth'
import { apiFetch } from '../services/api'

const KEY = ['scenarios']

// Save/load named calculator scenarios (signed-in users only, SPEC-consistent:
// server stores the same params the URL carries).
export default function ScenarioManager({ currentParams, onLoad }) {
  const { isAuthed } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const scenarios = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch('/api/scenarios'),
    enabled: isAuthed,
    staleTime: 60 * 1000,
  })

  const save = useMutation({
    mutationFn: () =>
      apiFetch('/api/scenarios', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), params: currentParams }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(KEY, data)
      setName('')
      setError('')
    },
    onError: (err) => setError(err?.message || 'Failed to save scenario.'),
  })

  const remove = useMutation({
    mutationFn: (id) => apiFetch(`/api/scenarios?id=${id}`, { method: 'DELETE' }),
    onSuccess: (data) => queryClient.setQueryData(KEY, data),
    onError: (err) => setError(err?.message || 'Failed to delete scenario.'),
  })

  if (!isAuthed) {
    return (
      <div className="border-t border-edge pt-4">
        <p className="text-xs text-txt-secondary">
          💾 Sign in (top right) to save and reload named scenarios.
        </p>
      </div>
    )
  }

  const list = scenarios.data?.scenarios ?? []
  const hasValues = Object.keys(currentParams).length > 0
  const nameTaken = list.some((s) => s.name === name.trim())

  return (
    <div className="border-t border-edge pt-4 flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-wider text-txt-secondary">Saved scenarios</p>

      {scenarios.isLoading && <p className="text-xs text-txt-secondary">Loading scenarios…</p>}
      {scenarios.isError && (
        <p className="text-xs text-negative">
          Couldn’t load scenarios.{' '}
          <button className="underline" onClick={() => scenarios.refetch()}>
            Retry
          </button>
        </p>
      )}

      {list.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => onLoad(s.params)}
                className="flex-1 min-w-0 text-left text-sm px-3 py-1.5 rounded-lg border border-edge/60 hover:border-edge-hover transition-colors truncate"
                title="Load this scenario"
              >
                {s.name}
              </button>
              <button
                onClick={() => remove.mutate(s.id)}
                disabled={remove.isPending}
                className="text-xs text-txt-secondary hover:text-negative transition-colors shrink-0"
                title="Delete scenario"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {!scenarios.isLoading && !scenarios.isError && list.length === 0 && (
        <p className="text-xs text-txt-secondary">
          No saved scenarios yet — name the current inputs and save them.
        </p>
      )}

      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Scenario name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && hasValues && save.mutate()}
        />
        <button
          className="btn-secondary shrink-0"
          onClick={() => save.mutate()}
          disabled={!name.trim() || !hasValues || save.isPending}
          title={nameTaken ? 'A scenario with this name will be overwritten' : 'Save current inputs'}
        >
          {save.isPending ? 'Saving…' : nameTaken ? 'Overwrite' : 'Save'}
        </button>
      </div>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  )
}
