// Server-side fetch helper: 10s timeout, one retry with backoff.
export async function fetchJson(url, options = {}) {
  const { timeoutMs = 10_000, retries = 1, ...init } = options
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      if (!res.ok) {
        const err = new Error(`Upstream request failed with status ${res.status}`)
        err.status = res.status
        throw err
      }
      return await res.json()
    } catch (err) {
      lastError = err
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) break
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}
