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

// 定义 Proposal 的数据结构
interface Proposal {
  id: number
  type: 'changeOrgName' | 'transfer'
  title: string
  description: string
  createdAt: string
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
  const [copied, setCopied] = useState(false)

  // 👇 新增：用于存放所有生成的 Proposal
  const [proposals, setProposals] = useState<Proposal[]>([])

  // 1. 获取 Vault 的 orgName
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

  const formatLongAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(SMART_WALLET_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {}
  }

  let formattedNative = '0.0000'
  if (nativeBalance && nativeBalance.value !== undefined) {
    formattedNative = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4)
  }

  const handleAddToken = async () => {
    // ... (保持你原有的逻辑)
    if (!isAddress(newTokenAddress) || !publicClient) return
    if (tokens.find(t => t.address.toLowerCase() === newTokenAddress.toLowerCase())) return
    setIsAdding(true)
    try {
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({ address: newTokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }),
        publicClient.readContract({ address: newTokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
      ])
      const newToken: Token = { address: newTokenAddress, symbol: symbol as string, name: 'Custom Asset', decimals: Number(decimals) }
      setTokens([...tokens, newToken])
      setNewTokenAddress('')
      setIsAddModalOpen(false)
      setTimeout(() => refetchBalances(), 500)
    } catch (error) {
      console.error(error)
    } finally {
      setIsAdding(false)
    }
  }

  // 👇 新增：创建 Proposal 的函数
  const createProposal = (type: 'changeOrgName' | 'transfer') => {
    const newProposal: Proposal = {
      id: Date.now(),
      type,
      title: type === 'changeOrgName' ? 'Change Org Name' : 'Transfer Funds',
      description: type === 'changeOrgName' ? 'Proposal to update the DAO name.' : 'Proposal to transfer assets out of the vault.',
      createdAt: new Date().toLocaleTimeString(),
    }
    // 把新的加到数组前面，方便看到最新的
    setProposals([newProposal, ...proposals])
  }

  // 👇 新增：删除 Proposal 的函数
  const removeProposal = (id: number) => {
    setProposals(proposals.filter(p => p.id !== id))
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 relative gap-8">
      
      {/* 👇 顶部操作栏 */}
      {isConnected && (
        <div className="w-full max-w-4xl flex items-center justify-end gap-3 bg-[#1a1a1a]/80 p-4 rounded-2xl border border-[#2a2a2a] shadow-lg">
          <span className="text-sm text-gray-400 mr-auto pl-2">DAO Proposals:</span>
          <button 
            onClick={() => createProposal('changeOrgName')}
            className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            org name
          </button>
          <button 
            onClick={() => createProposal('transfer')}
            className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
             transfer
          </button>
        </div>
      )}

      {/* 主体内容区（左侧便利贴，右侧控制台） */}
      <div className="flex items-start justify-center w-full max-w-6xl gap-8 relative mt-4">
        
        {/* 👇 左侧：动态渲染的便利贴列表 */}
        <div className="hidden lg:flex flex-col gap-6 w-64">
          {proposals.map((prop, index) => (
            <div 
              key={prop.id}
              className="relative bg-yellow-200 w-full p-5 rounded-lg shadow-xl text-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-[fadeIn_0.3s_ease-out]"
              style={{ 
                transform: `rotate(${index % 2 === 0 ? '-2deg' : '2deg'})`, 
                zIndex: 10 - index 
              }}
            >
              {/* 胶带 */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/50 backdrop-blur-sm -rotate-2 shadow-sm pointer-events-none"></div>
              
              <h3 className="font-bold text-sm mb-2 flex items-center justify-between border-b border-yellow-300/50 pb-2">
                <span className="truncate">{prop.title}</span>
                {/* 关闭/丢弃按钮 */}
                <button onClick={() => removeProposal(prop.id)} className="text-gray-500 hover:text-red-500 text-xs">✕</button>
              </h3>
              
              <p className="text-xs text-gray-600 leading-tight mb-3">
                {prop.description}
              </p>
              
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span>{prop.createdAt}</span>
                <span className="bg-white/50 px-1.5 py-0.5 rounded">Draft</span>
              </div>
            </div>
          ))}
          {proposals.length === 0 && (
            <div className="text-center p-6 border-2 border-dashed border-[#2a2a2a] rounded-xl text-gray-600 text-sm">
              No active proposals.<br/>Use actions above.
            </div>
          )}
        </div>

        {/* 右侧：主控制台卡片 */}
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
                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-bold rounded uppercase tracking-wider max-w-[150px] truncate block">
                    {isOrgNameLoading ? '...' : (orgName || "Unknown DAO")}
                  </span>
                </h1>
                <p className="text-xs text-gray-400 mt-1">Governed by consensus | Secured by code.</p>
              </div>
            </div>
            {isConnected ? (
              <button onClick={() => disconnect()} className="px-4 py-2 text-sm bg-[#222] hover:bg-rose-500/10 text-gray-300 hover:text-rose-400 border border-[#333] rounded-lg transition-all">Disconnect</button>
            ) : (
              <button onClick={() => connect({ connector: connectors[0] })} disabled={isPending} className="px-5 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-lg">{isPending ? '...' : 'Connect'}</button>
            )}
          </div>

          {/* 内部内容保持原样即可 */}
          {isConnected ? (
             <div className="p-6 space-y-6 animate-[fadeIn_0.3s_ease-out]">
               {/* Vault Address 栏 */}
               <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-[#2a2a2a]">
                 <div>
                   <div className="text-xs text-gray-500 mb-1">Vault Address</div>
                   <div className="flex items-center gap-2">
                     <div className="relative flex items-center gap-2 cursor-pointer group" onClick={handleCopyAddress}>
                       <span className="font-mono text-sm text-gray-200 group-hover:text-orange-400 transition-colors">{formatLongAddress(SMART_WALLET_ADDRESS)}</span>
                       <svg className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                       {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-[fadeIn_0.2s_ease-out]">Copied!</span>}
                     </div>
                     <span className="px-2 py-0.5 bg-[#222] text-gray-300 border border-[#333] text-[10px] font-bold rounded uppercase">{chain?.name || `Chain ${chainId}`}</span>
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="text-xs text-gray-500 mb-1">Status</div>
                   <div className="flex items-center gap-2 justify-end">
                     <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                     <span className="text-sm text-emerald-400 font-medium">Consensus Active</span>
                   </div>
                 </div>
               </div>

               {/* 资产列表 */}
               <div>
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-lg font-semibold text-white">Vault Assets</h2>
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between items-center p-4 bg-[#1a1a1a]/50 hover:bg-[#222] rounded-xl transition-colors border border-[#2a2a2a] hover:border-[#444] cursor-pointer">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xl shadow-inner text-orange-400">₿</div>
                       <div><div className="font-bold text-white">Rootstock</div><div className="text-xs text-gray-400">Native Currency</div></div>
                     </div>
                     <div className="text-right"><div className="font-bold text-white">{isNativeLoading ? '...' : formattedNative}</div><div className="text-xs text-gray-400">RBTC</div></div>
                   </div>
                   {tokens.map((token, index) => {
                     const balanceData = tokenBalances?.[index]
                     const isError = balanceData?.status === 'failure'
                     let formattedBalance = '0.0000'
                     if (balanceData?.status === 'success') {
                       formattedBalance = parseFloat(formatUnits(BigInt(balanceData.result), token.decimals)).toFixed(4)
                     }
                     return (
                       <div key={token.address} className="flex justify-between items-center p-4 bg-[#1a1a1a]/50 hover:bg-[#222] rounded-xl transition-colors border border-[#2a2a2a] hover:border-[#444] cursor-pointer">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-orange-950/40 border border-orange-500/20 flex items-center justify-center font-bold text-orange-300 text-sm">{token.symbol.substring(0, 2)}</div>
                           <div><div className="font-bold text-white">{token.symbol}</div><div className="text-xs text-gray-500 font-mono" title={token.address}>{formatAddress(token.address)}</div></div>
                         </div>
                         <div className="text-right">
                           <div className="font-bold text-white">{isTokensLoading ? '...' : isError ? <span className="text-rose-500 text-xs">Error</span> : formattedBalance}</div>
                           <div className="text-xs text-gray-400">{token.symbol}</div>
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>

               {/* 底部按钮 */}
               <div className="pt-4 border-t border-[#2a2a2a] grid grid-cols-2 gap-3">
                 <button onClick={() => createProposal('transfer')} className="py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)]">Propose Transfer</button>
                 <button onClick={() => setIsAddModalOpen(true)} className="py-3 bg-[#222] hover:bg-[#333] text-white font-medium rounded-xl border border-[#333] transition-all">Track New Asset</button>
               </div>
             </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 border border-[#2a2a2a]">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Vault Locked</h2>
              <p className="text-gray-400 mb-6 max-w-sm text-sm">Connect your authorized signer wallet to access the Rootstock Vault.</p>
            </div>
          )}
        </div>
      </div>

      {/* 添加自定义代币弹窗 (保持原样) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-white mb-2">Track New Asset</h3>
            <p className="text-xs text-gray-400 mb-4">Enter ERC-20 contract address to monitor.</p>
            <input type="text" value={newTokenAddress} onChange={(e) => setNewTokenAddress(e.target.value)} placeholder="0x..." className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors mb-2 font-mono" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm transition-all">Cancel</button>
              <button onClick={handleAddToken} disabled={isAdding || !newTokenAddress} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">{isAdding ? '...' : 'Add Asset'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App