import { useQuery } from '@tanstack/react-query'
import { getPools } from '../services/defillama'

export default function usePools() {
  return useQuery({
    queryKey: ['defillama-pools'],
    queryFn: getPools,
    staleTime: 10 * 60 * 1000,
  })
}
