// src/wagmi.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { defineChain } from 'viem'

// 1. 手动定义 Rootstock 链
const rootstock = defineChain({
  id: 31, 
  name: 'Rootstock',
  nativeCurrency: { name: 'Rootstock Bitcoin', symbol: 'tRBTC', decimals: 18 },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ROOTSTOCK_RPC_URL as string],
    },
  },
})

const projectId = import.meta.env.VITE_WC_PROJECT_ID

export const config = createConfig({
  chains: [rootstock, mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId, showQrModal: true }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [rootstock.id]: http(),
  },
})