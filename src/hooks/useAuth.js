import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, useChainId, useSignMessage } from 'wagmi'
import { createSiweMessage } from 'viem/siwe'
import { apiFetch } from '../services/api'

// Session state + SIWE sign-in/out. `user` is null when signed out.
export default function useAuth() {
  const queryClient = useQueryClient()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState('')

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await apiFetch('/api/auth/me')
      } catch (err) {
        if (err.status === 401) return null // signed out is a state, not an error
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const signIn = async () => {
    if (!address) return
    setSignInError('')
    setSigningIn(true)
    try {
      const { nonce } = await apiFetch('/api/auth/nonce')
      const message = createSiweMessage({
        address,
        chainId: chainId || 1,
        domain: window.location.host,
        uri: window.location.origin,
        nonce,
        version: '1',
        statement: 'Sign in to DeFi Lens.',
      })
      const signature = await signMessageAsync({ message })
      await apiFetch('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ message, signature }),
      })
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
    } catch (err) {
      // user rejecting the wallet prompt is not worth an error banner
      const rejected = /reject|denied|cancel/i.test(err?.message || '')
      setSignInError(rejected ? '' : err?.message || 'Sign-in failed.')
      throw err
    } finally {
      setSigningIn(false)
    }
  }

  const signOut = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } finally {
      queryClient.setQueryData(['auth', 'me'], null)
      queryClient.removeQueries({ queryKey: ['positions'] })
      queryClient.removeQueries({ queryKey: ['wallets'] })
    }
  }

  const user = me.data ?? null
  return {
    user,
    isAuthed: Boolean(user),
    isLoading: me.isLoading,
    // signed in with a different wallet than currently connected
    addressMismatch:
      Boolean(user) && Boolean(address) && user.address !== address.toLowerCase(),
    isConnected,
    signIn,
    signOut,
    signingIn,
    signInError,
  }
}
