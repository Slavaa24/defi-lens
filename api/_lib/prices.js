import { fetchJson } from './http.js'

const CG_BASE = 'https://api.coingecko.com/api/v3'

function cgHeaders() {
  const key = process.env.COINGECKO_KEY
  return key ? { 'x-cg-demo-api-key': key } : {}
}

// chain slug (our naming) -> CoinGecko asset platform id
const PLATFORMS = {
  Ethereum: 'ethereum',
  Base: 'base',
}

// contracts: lowercase addresses. Returns { [address]: priceUsd }
export async function getContractPrices(chain, contracts) {
  const platform = PLATFORMS[chain]
  if (!platform || contracts.length === 0) return {}
  const out = {}
  // CoinGecko caps addresses per call; chunk conservatively
  for (let i = 0; i < contracts.length; i += 50) {
    const chunk = contracts.slice(i, i + 50)
    try {
      const data = await fetchJson(
        `${CG_BASE}/simple/token_price/${platform}?contract_addresses=${chunk.join(',')}&vs_currencies=usd`,
        { headers: cgHeaders() }
      )
      for (const [addr, val] of Object.entries(data)) {
        out[addr.toLowerCase()] = val?.usd ?? null
      }
    } catch {
      // pricing failure for a chunk -> those tokens render as unpriced, not fabricated
    }
  }
  return out
}

export async function getEthPrice() {
  try {
    const data = await fetchJson(`${CG_BASE}/simple/price?ids=ethereum&vs_currencies=usd`, {
      headers: cgHeaders(),
    })
    return data.ethereum?.usd ?? null
  } catch {
    return null
  }
}
