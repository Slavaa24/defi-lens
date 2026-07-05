import { useEffect } from 'react'

const DEFAULT_TITLE = 'DeFi Lens — LP analytics & impermanent loss monitoring'

// Per-page <title>. Pass nothing on the landing page to keep the default.
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · DeFi Lens` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
