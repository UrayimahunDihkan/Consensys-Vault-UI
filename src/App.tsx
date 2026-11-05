// src/App.tsx
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useReadContracts, usePublicClient } from 'wagmi'
import { formatUnits, isAddress } from 'viem'
import { useState } from 'react'

// 🔒 你的企业级智能钱包地址 (请确保地址正确)
const SMART_WALLET_ADDRESS = '0xDE57aEDAC1B7425C1E5368E7E8A1FF1C891d9884'

// 默认内置代币 (Sepolia)
const INITIAL_TOKENS = [
  {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // Sepolia LINK
    symbol: 'LINK',
    name: 'ChainLink Token',
    decimals: 18,
  }
]

// ERC20 ABI
const ERC20_ABI = [
  { "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "type": "uint8" }], "stateMutability": "view", "type": "function" },
] as const

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
}

function App() {
  const { isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  // 状态：代币列表 & 添加代币弹窗
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // 1. 获取 Smart Wallet 的原生 ETH 余额
  const { data: ethBalance, isLoading: isEthLoading } = useBalance({
    address: SMART_WALLET_ADDRESS,
    query: { enabled: isConnected },
  })

  // 2. 批量获取 Smart Wallet 的 ERC-20 代币余额
  const { data: tokenBalances, isLoading: isTokensLoading, refetch: refetchBalances } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [SMART_WALLET_ADDRESS],
    })),
    query: { enabled: isConnected && tokens.length > 0 },
  })

  // 格式化地址
  const formatAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // 手动格式化 ETH 余额
  let formattedEth = '0.0000'
  if (ethBalance && ethBalance.value !== undefined) {
    formattedEth = parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4)
  }

  // 处理添加自定义代币
  const handleAddToken = async () => {
    if (!isAddress(newTokenAddress) || !publicClient) {
      setAddError('无效的合约地址')
      return
    }

    // 检查是否已存在
    if (tokens.find(t => t.address.toLowerCase() === newTokenAddress.toLowerCase())) {
      setAddError('该代币已添加')
      return
    }

    setIsAdding(true)
    setAddError('')

    try {
      // 从链上读取 symbol 和 decimals
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({ address: newTokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }),
        publicClient.readContract({ address: newTokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
      ])

      const newToken: Token = {
        address: newTokenAddress,
        symbol: symbol as string,
        name: 'Custom Token',
        decimals: Number(decimals),
      }

      setTokens([...tokens, newToken])
      setNewTokenAddress('')
      setIsAddModalOpen(false)
      setTimeout(() => refetchBalances(), 500)
    } catch (error) {
      console.error(error)
      setAddError('读取代币信息失败，请确认地址是否正确且在当前网络')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative">
      
      {/* 企业级控制台卡片容器 */}
      <div className="w-full max-w-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden">
        
        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Enterprise Vault</h1>
              <p className="text-xs text-indigo-300">Smart Account Dashboard</p>
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 text-sm bg-white/5 hover:bg-rose-500/10 text-gray-300 hover:text-rose-400 border border-white/10 rounded-lg transition-all"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]"
            >
              {isPending ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>

        {isConnected ? (
          <div className="p-6 space-y-6 animate-[fadeIn_0.3s_ease-out]">
            
            {/* Smart Wallet 账户信息栏 */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
              <div>
                <div className="text-xs text-gray-400 mb-1">Smart Account Address</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-200">{SMART_WALLET_ADDRESS}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded uppercase">
                    {chain?.name || `Chain ${chainId}`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Status</div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm text-emerald-400 font-medium">Active</span>
                </div>
              </div>
            </div>

            {/* 资产列表区域 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Vault Portfolio</h2>
                <span className="text-xs text-gray-400">All Assets</span>
              </div>

              <div className="space-y-2">
                {/* 原生 ETH 行 */}
                <div className="flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                      💎
                    </div>
                    <div>
                      <div className="font-bold text-white">Ethereum</div>
                      <div className="text-xs text-gray-400">Native Currency</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {isEthLoading ? '...' : formattedEth}
                    </div>
                    <div className="text-xs text-gray-400">ETH</div>
                  </div>
                </div>

                {/* ERC-20 代币遍历列表 */}
                {tokens.map((token, index) => {
                  const balanceData = tokenBalances?.[index]
                  const isError = balanceData?.status === 'failure'
                  
                  let formattedBalance = '0.0000'
                  if (balanceData?.status === 'success') {
                    formattedBalance = parseFloat(formatUnits(balanceData.result as bigint, token.decimals)).toFixed(4)
                  }

                  return (
                    <div key={token.address} className="flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
                          {token.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{token.symbol}</div>
                          <div className="text-xs text-gray-400 font-mono" title={token.address}>
                            {formatAddress(token.address)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {isTokensLoading ? (
                            <span className="animate-pulse text-gray-500">加载中</span>
                          ) : isError ? (
                            <span className="text-rose-500 text-xs">读取失败</span>
                          ) : (
                            formattedBalance
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{token.symbol}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 操作按钮区 */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <button className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                Transfer Funds
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
              >
                Add Custom Token
              </button>
            </div>

          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6 max-w-sm">
              Please connect your authorized wallet to access the enterprise smart account vault.
            </p>
          </div>
        )}
      </div>

      {/* 添加自定义代币弹窗 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-white mb-2">Add Custom Token</h3>
            <p className="text-xs text-gray-400 mb-4">输入你要监控的代币合约地址</p>
            
            <input
              type="text"
              value={newTokenAddress}
              onChange={(e) => setNewTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors mb-2 font-mono"
            />
            {addError && <div className="text-rose-400 text-xs mb-4">{addError}</div>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToken}
                disabled={isAdding || !newTokenAddress}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
              >
                {isAdding ? 'Adding...' : 'Add Token'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App