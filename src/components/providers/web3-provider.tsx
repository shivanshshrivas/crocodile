'use client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'
import { useState, useEffect } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }))

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render providers, but with safe fallbacks
  return (
    <QueryClientProvider client={qc}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({ accentColor: '#16A34A' }),
            darkMode: darkTheme({ accentColor: '#16A34A' }),
          }}
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
