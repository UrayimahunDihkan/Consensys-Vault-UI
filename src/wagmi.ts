// src/wagmi.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

// 1. 手动定义 Rootstock 链
const rootstock = defineChain({
  id: 31, 
  name: 'Rootstock',
  nativeCurrency: { name: 'Rootstock Bitcoin', symbol: 'RBTC', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://public-node.testnet.rsk.co'],
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
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/Ho9YPp3W8pLUprghQjFtK'),
    // 3. 给 rootstock 配置 RPC 传输
    [rootstock.id]: http('https://rpc.testnet.rootstock.io/OOjwiraKsMFZ4Bjzhq3VHlpLg1ayVb-T'),
  },
})