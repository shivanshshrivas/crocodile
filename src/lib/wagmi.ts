import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { polygon, polygonAmoy, sepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'InterChain Supply',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // get from cloud.walletconnect.com
  chains: [sepolia, polygonAmoy, polygon],    // Start with testnets first
  ssr: true,
  enableInjectedConnectorFallback: true,
})
