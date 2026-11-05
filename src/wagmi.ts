// src/wagmi.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(), // 自动检测 MetaMask 等浏览器钱包
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})