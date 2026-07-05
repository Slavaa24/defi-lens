import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import App from './App'
import './index.css'

const wagmiConfig = createConfig({
  chains: [mainnet, base],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
