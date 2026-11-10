// src/App.tsx
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useReadContracts, usePublicClient, useReadContract } from 'wagmi'
import { formatUnits, isAddress } from 'viem'
import { useState } from 'react'
import { SmartWalletABI } from './abi/SmartWalletABI' 

// 🔒 Rootstock 上的合约地址
const SMART_WALLET_ADDRESS = import.meta.env.VITE_SMART_WALLET_ADDRESS as `0x${string}`

// 默认内置代币 (Rootstock Mainnet)
const INITIAL_TOKENS = [
  {
    address: '0x5a767e7A1A42e5B55A6409024D09D6417AC47B2F', // Rootstock USDT
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
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

  // 👇 新增：用于显示“已复制”提示的状态
  const [copied, setCopied] = useState(false)

  // 1. 获取 Vault 的 orgName (组织名字)
  const { data: orgName, isLoading: isOrgNameLoading } = useReadContract({
    address: SMART_WALLET_ADDRESS,
    abi: SmartWalletABI,
    functionName: 'orgName',
    query: { enabled: isConnected },
  });

  // 2. 获取 Vault 的原生 RBTC 余额
  const { data: nativeBalance, isLoading: isNativeLoading } = useBalance({
    address: SMART_WALLET_ADDRESS,
    query: { enabled: isConnected },
  })

  // 3. 批量获取 Vault 的 ERC-20 代币余额
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

  // 格式化长地址（首 6 尾 4，中间用 ... 代替）
  const formatLongAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // 👇 新增：处理复制逻辑
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(SMART_WALLET_ADDRESS)
      setCopied(true)
      // 2秒后清除“已复制”状态
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  // 手动格式化 RBTC 余额 (Rootstock 原生代币是 18 位精度)
  let formattedNative = '0.0000'
  if (nativeBalance && nativeBalance.value !== undefined) {
    formattedNative = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4)
  }

  // 处理添加自定义代币
  const handleAddToken = async () => {
    if (!isAddress(newTokenAddress) || !publicClient) {
      setAddError('Invalid contract address')
      return
    }

    if (tokens.find(t => t.address.toLowerCase() === newTokenAddress.toLowerCase())) {
      setAddError('Asset already tracked')
      return
    }

    setIsAdding(true)
    setAddError('')

    try {
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({ address: newTokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }),
        publicClient.readContract({ address: newTokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
      ])

      const newToken: Token = {
        address: newTokenAddress,
        symbol: symbol as string,
        name: 'Custom Asset',
        decimals: Number(decimals),
      }

      setTokens([...tokens, newToken])
      setNewTokenAddress('')
      setIsAddModalOpen(false)
      setTimeout(() => refetchBalances(), 500)
    } catch (error) {
      console.error(error)
      setAddError('Failed to read token data. Check network.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative">
      
      {/* 组织级控制台卡片容器 */}
      <div className="w-full max-w-2xl bg-[#111111]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 overflow-hidden">
        
        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center p-6 border-b border-[#2a2a2a] bg-[#1a1a1a]/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Consensys Vault
                <span 
                  className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-bold rounded uppercase tracking-wider max-w-[150px] truncate block"
                  title={orgName || "Loading..."}
                >
                  {isOrgNameLoading ? (
                    <span className="animate-pulse bg-orange-400/50 w-8 h-3 inline-block rounded"></span>
                  ) : (
                    orgName || "Unknown DAO"
                  )}
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">Governed by consensus | Secured by code.</p>
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 text-sm bg-[#222] hover:bg-rose-500/10 text-gray-300 hover:text-rose-400 border border-[#333] rounded-lg transition-all"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending}
              className="px-5 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            >
              {isPending ? 'Authenticating...' : 'Connect Signer'}
            </button>
          )}
        </div>

        {isConnected ? (
          <div className="p-6 space-y-6 animate-[fadeIn_0.3s_ease-out]">
            
            {/* Vault 账户信息栏 */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-[#2a2a2a]">
              <div>
                <div className="text-xs text-gray-500 mb-1">Vault Address</div>
                <div className="flex items-center gap-2">
                  
                  {/* 👇 这里替换成了可点击复制的长地址省略组件 */}
                  <div 
                    className="relative flex items-center gap-2 cursor-pointer group"
                    onClick={handleCopyAddress}
                    title="Click to copy"
                  >
                    <span className="font-mono text-sm text-gray-200 group-hover:text-orange-400 transition-colors">
                      {formatLongAddress(SMART_WALLET_ADDRESS)}
                    </span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {/* 悬浮提示 */}
                    {copied && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-[fadeIn_0.2s_ease-out]">
                        Copied!
                      </span>
                    )}
                  </div>

                  <span className="px-2 py-0.5 bg-[#222] text-gray-300 border border-[#333] text-[10px] font-bold rounded uppercase">
                    {chain?.name || `Chain ${chainId}`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm text-emerald-400 font-medium">Consensus Active</span>
                </div>
              </div>
            </div>

            {/* 资产列表区域 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Vault Assets</h2>
                <span className="text-xs text-gray-500">Tracked Assets</span>
              </div>

              <div className="space-y-2">
                {/* 原生 RBTC 行 */}
                <div className="flex justify-between items-center p-4 bg-[#1a1a1a]/50 hover:bg-[#222] rounded-xl transition-colors border border-[#2a2a2a] hover:border-[#444] cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xl shadow-inner text-orange-400">
                      ₿
                    </div>
                    <div>
                      <div className="font-bold text-white">Rootstock</div>
                      <div className="text-xs text-gray-400">Native Currency</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {isNativeLoading ? '...' : formattedNative}
                    </div>
                    <div className="text-xs text-gray-400">RBTC</div>
                  </div>
                </div>

                {/* ERC-20 代币遍历列表 */}
                {tokens.map((token, index) => {
                  const balanceData = tokenBalances?.[index]
                  const isError = balanceData?.status === 'failure'
                  
                  let formattedBalance = '0.0000'
                  if (balanceData?.status === 'success') {
                    formattedBalance = parseFloat(formatUnits(BigInt(balanceData.result) , token.decimals)).toFixed(4)
                  }

                  return (
                    <div key={token.address} className="flex justify-between items-center p-4 bg-[#1a1a1a]/50 hover:bg-[#222] rounded-xl transition-colors border border-[#2a2a2a] hover:border-[#444] cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-950/40 border border-orange-500/20 flex items-center justify-center font-bold text-orange-300 text-sm">
                          {token.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{token.symbol}</div>
                          <div className="text-xs text-gray-500 font-mono" title={token.address}>
                            {formatAddress(token.address)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {isTokensLoading ? (
                            <span className="animate-pulse text-gray-500">Loading</span>
                          ) : isError ? (
                            <span className="text-rose-500 text-xs">Error</span>
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
            <div className="pt-4 border-t border-[#2a2a2a] grid grid-cols-2 gap-3">
              <button className="py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)]">
                Propose Transfer
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="py-3 bg-[#222] hover:bg-[#333] text-white font-medium rounded-xl border border-[#333] transition-all"
              >
                Track New Asset
              </button>
            </div>

          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 border border-[#2a2a2a]">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Vault Locked</h2>
            <p className="text-gray-400 mb-6 max-w-sm text-sm">
              Connect your authorized signer wallet to access the Rootstock Vault.
            </p>
          </div>
        )}
      </div>

      {/* 添加自定义代币弹窗 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-white mb-2">Track New Asset</h3>
            <p className="text-xs text-gray-400 mb-4">Enter ERC-20 contract address to monitor.</p>
            
            <input
              type="text"
              value={newTokenAddress}
              onChange={(e) => setNewTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500 transition-colors mb-2 font-mono"
            />
            {addError && <div className="text-rose-400 text-xs mb-4">{addError}</div>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToken}
                disabled={isAdding || !newTokenAddress}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
              >
                {isAdding ? 'Verifying...' : 'Add Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App