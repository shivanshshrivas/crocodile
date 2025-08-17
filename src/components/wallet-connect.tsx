"use client"

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from 'react'

export function WalletConnect() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
    )
  }

  try {
    return <ConnectButton />
  } catch (error) {
    console.warn('WalletConnect error:', error)
    return (
      <div className="h-9 px-3 bg-muted text-muted-foreground rounded-md flex items-center text-sm">
        Wallet
      </div>
    )
  }
}
