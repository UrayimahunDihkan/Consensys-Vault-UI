// src/wagmi.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
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
  // blockExplorers: {
  //   default: { name: 'Rootstock Explorer', url: 'https://explorer.rootstock.io' },
  // },
})

export const config = createConfig({
  // 2. 把 rootstock 加到 chains 数组里
  chains: [mainnet, sepolia, rootstock],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [rootstock.id]: http(),
  },
})