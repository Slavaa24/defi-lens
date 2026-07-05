import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../services/api'

// Positions + wallets live in one server response; mutations write it back
// into the same cache key so the dashboard updates without an extra GET.
const KEY = ['positions']

export default function usePositions({ enabled = true } = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch('/api/positions'),
    enabled,
    staleTime: 60 * 1000,
  })

  const refresh = useMutation({
    mutationFn: (walletId) =>
      apiFetch('/api/positions', {
        method: 'POST',
        body: JSON.stringify(walletId ? { walletId } : {}),
      }),
    onSuccess: (data) => queryClient.setQueryData(KEY, data),
  })

  const addWallet = useMutation({
    mutationFn: ({ address, label }) =>
      apiFetch('/api/wallets', { method: 'POST', body: JSON.stringify({ address, label }) }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: KEY })
      // spec §5.5: adding a wallet immediately triggers discovery for it
      refresh.mutate(data.wallet.id)
    },
  })

  const removeWallet = useMutation({
    mutationFn: (id) => apiFetch(`/api/wallets?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })

  return {
    positions: query.data?.positions ?? [],
    wallets: query.data?.wallets ?? [],
    refreshErrors: query.data?.errors ?? [],
    query,
    refresh,
    addWallet,
    removeWallet,
  }
}
