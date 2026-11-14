// src/App.tsx
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useReadContracts, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { formatUnits, isAddress, parseUnits } from 'viem'
import { useState, useMemo } from 'react'
import { SmartWalletABI } from './abi/SmartWalletABI' 
import { ProposalSignABI } from './abi/ProposalSignABI' 
import { ProposalList } from './components/ProposalList'
import type { Proposal, ProposalType } from './components/ProposalList'
import { AddTokenModal } from './components/AddTokenModal'
import { TopActions } from './components/TopActions'
import { SignConfirmModal } from './components/SignConfirmModal'


const SMART_WALLET_ADDRESS = import.meta.env.VITE_SMART_WALLET_ADDRESS as `0x${string}`
const PROPOSAL_SIGN_ADDRESS = import.meta.env.VITE_PROPOSAL_SIGN_ADDRESS as `0x${string}`

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

// 👇 链上 enum 值 -> 前端 type
const ENUM_TO_TYPE: Record<number, ProposalType> = {
  0: 'changeOrgName',
  1: 'transfer',
  2: 'addMember',
}

// 标题/描述映射
const TYPE_META: Record<ProposalType, { title: string; description: string }> = {
  changeOrgName: { title: 'Change Org Name', description: 'Proposal to update the DAO name.' },
  transfer: { title: 'Transfer Funds', description: 'Proposal to transfer assets out of the vault.' },
  addMember: { title: 'Add New Member', description: 'Proposal to grant membership and signer rights.' },
}

// 币种下拉选项
interface CoinOption {
  key: string
  symbol: string
  decimals: number
  address?: `0x${string}` 
}

function App() {
  const { isConnected, chain, address } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  // 状态：代币列表 & 添加代币弹窗
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // 👇 Proposal 弹窗 & 表单状态
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [proposalType, setProposalType] = useState<ProposalType>('changeOrgName')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newOrgName, setNewOrgName] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferValue, setTransferValue] = useState('')
  const [selectedCoinKey, setSelectedCoinKey] = useState<string>('native')
  const [memberAccount, setMemberAccount] = useState('')

  // 👇 签名确认弹窗状态
  const [signTarget, setSignTarget] = useState<Proposal | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState('')

  // 👇 执行状态 (Execute 按钮)
  const [executingHash, setExecutingHash] = useState<string | null>(null)

  // 币种选项：原生 RBTC + 已追踪 ERC20
  const coinOptions: CoinOption[] = useMemo(() => [
    { key: 'native', symbol: 'RBTC', decimals: 18 },
    ...tokens.map(t => ({ key: t.address, symbol: t.symbol, decimals: t.decimals, address: t.address as `0x${string}` })),
  ], [tokens])

  const selectedCoin = coinOptions.find(c => c.key === selectedCoinKey)

  // 1. 获取 Vault 的 orgName
  const { data: orgName, isLoading: isOrgNameLoading, refetch: refetchOrgName } = useReadContract({
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

  // 👇 4. 读链上所有 proposal
  const { data: onChainProposals, refetch: refetchProposals } = useReadContract({
    address: PROPOSAL_SIGN_ADDRESS,
    abi: ProposalSignABI,
    functionName: 'allProposals',
    query: { enabled: isConnected },
  })

  // 👇 链上数据 -> 展示结构
  const proposals: Proposal[] = useMemo(() => {
    if (!onChainProposals) return []
    return onChainProposals.map((p, idx) => {
      const enumValue = Number(p.proposal)
      const type = ENUM_TO_TYPE[enumValue] ?? 'changeOrgName'
      const meta = TYPE_META[type]
      const desc = type === 'changeOrgName' && p.infos[0]
        ? `→ New name: "${p.infos[0]}"`
        : meta.description
      return {
        hash: `0x${idx}` as `0x${string}`,
        type,
        applicant: p.applicant,
        title: meta.title,
        description: desc,
        infos: p.infos,
        signatures: p.signatures,
        execFlow: Number(p.execFlow),
        enumValue,
      }
    })
  }, [onChainProposals])

  // 👇 签名确认弹窗操作
  const openSignConfirm = (proposal: Proposal) => {
    setSignTarget(proposal)
    setSignError('')
    setIsSigning(false)
  }

  const closeSignConfirm = () => {
    setSignTarget(null)
    setSignError('')
    setIsSigning(false)
  }

  const confirmSign = async () => {
    if (!signTarget) return
    setIsSigning(true)
    setSignError('')

    try {
      const hash = await writeContractAsync({
        address: PROPOSAL_SIGN_ADDRESS,
        abi: ProposalSignABI,
        functionName: 'signProposal',
        args: [signTarget.enumValue],
      })
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      await refetchProposals()
      closeSignConfirm()
    } catch (e: any) {
      console.error(e)
      setSignError(e?.shortMessage || e?.message || 'Sign transaction failed')
    } finally {
      setIsSigning(false)
    }
  }

  // 👇 执行 Org Name Change 操作
  const handleExecute = async (proposal: Proposal) => {
    if (!proposal.infos[0]) return

    setExecutingHash(proposal.hash)

    try {
      // 调用 Vault 的 setOrgName
      const hash = await writeContractAsync({
        address: SMART_WALLET_ADDRESS,
        abi: SmartWalletABI,
        functionName: 'setOrgName',
        args: [proposal.infos[0]],
      })
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      
      // 刷新数据（更新orgName，以及重新拉取proposal列表）
      await Promise.all([refetchOrgName(), refetchProposals()])
      
    } catch (e: any) {
      console.error(e)
      alert(e?.shortMessage || e?.message || 'Execute failed')
    } finally {
      setExecutingHash(null)
    }
  }

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

  const handleAddToken = async (tokenAddress: string) => {
    if (!isAddress(tokenAddress) || !publicClient) throw new Error('Invalid address')
    if (tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase())) throw new Error('Token already tracked')

    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }),
      publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
    ])

    const newToken: Token = {
      address: tokenAddress,
      symbol: symbol as string,
      name: 'Custom Asset',
      decimals: Number(decimals),
    }

    setTokens(prev => [...prev, newToken])
    setIsAddModalOpen(false)
    setTimeout(() => refetchBalances(), 500)
  }

  const openProposalModal = (type: ProposalType) => {
    setProposalType(type)
    setFormError('')
    setNewOrgName('')
    setTransferTo('')
    setTransferValue('')
    setSelectedCoinKey('native')
    setMemberAccount('')
    setIsProposalModalOpen(true)
  }

  const validateForm = (): string | null => {
    if (proposalType === 'changeOrgName') {
      if (!newOrgName.trim()) return 'Org name cannot be empty'
    }
    if (proposalType === 'transfer') {
      if (!isAddress(transferTo)) return 'Invalid recipient address'
      if (!transferValue || Number(transferValue) <= 0) return 'Amount must be > 0'
      if (!selectedCoin) return 'Please select a coin'
    }
    if (proposalType === 'addMember') {
      if (!isAddress(memberAccount)) return 'Invalid member address'
    }
    return null
  }

  const submitProposal = async () => {
    const err = validateForm()
    if (err) { setFormError(err); return }

    setFormError('')
    setIsSubmitting(true)

    try {
      if (proposalType === 'changeOrgName') {
        const hash = await writeContractAsync({
          address: PROPOSAL_SIGN_ADDRESS,
          abi: ProposalSignABI,
          functionName: 'proposeOrgNameChange',
          args: [newOrgName],
        })

        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
        await refetchProposals()
        setIsProposalModalOpen(false)
        return
      }

      if (proposalType === 'transfer') {
        if (!selectedCoin) throw new Error('Coin not selected')

        // 👇 将输入的金额（字符串）按照代币的 decimals 转换为 BigInt
        const amountInWei = parseUnits(transferValue, selectedCoin.decimals)
        // 如果是原生代币 (RBTC)，合约通常用 address(0) 表示
        const tokenAddress = selectedCoin.address ?? '0x0000000000000000000000000000000000000000'

        const hash = await writeContractAsync({
          address: PROPOSAL_SIGN_ADDRESS,
          abi: ProposalSignABI,
          functionName: 'proposeTransfer',
          args: [
            transferTo as `0x${string}`,
            tokenAddress as `0x${string}`,
            amountInWei,
          ],
        })

        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
        await refetchProposals()
        setIsProposalModalOpen(false)
        return
      }

      // 如果 addMember 的合约也写好了，记得在这里加上真实的合约调用
      if (proposalType === 'addMember') {
        console.log('[Proposal] addMember:', { memberAccount })
        // TODO: 调用合约 proposeAddMember
      }

      setIsProposalModalOpen(false)
    } catch (e: any) {
      console.error(e)
      setFormError(e?.shortMessage || e?.message || 'Transaction failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 👇 计算当前选中币种的可用余额
  let currentAvailableBalance = '0.0000'
  if (selectedCoin) {
    if (selectedCoin.key === 'native') {
      // 原生代币
      currentAvailableBalance = formattedNative
    } else {
      // ERC20 代币（从 tokenBalances 数组中找对应的索引）
      const tokenIndex = tokens.findIndex(t => t.address.toLowerCase() === selectedCoin.address?.toLowerCase())
      if (tokenIndex !== -1 && tokenBalances?.[tokenIndex]?.status === 'success') {
        const balanceData = tokenBalances[tokenIndex]
        currentAvailableBalance = parseFloat(
          formatUnits(BigInt(balanceData.result), selectedCoin.decimals)
        ).toFixed(4)
      }
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 relative gap-8">
      
      {isConnected && <TopActions onOpenProposal={openProposalModal} />}

      {/* 主体内容区 */}
      <div className="flex items-start justify-center w-full max-w-6xl gap-8 relative mt-4">
        
        {/* 左侧便利贴 */}
        {isConnected && (
          <ProposalList 
            proposals={proposals} 
            formatAddress={formatAddress} 
            onSign={openSignConfirm} 
            onExecute={handleExecute} 
            executingHash={executingHash} 
          />
        )}

        {/* 主卡片 */}
        <div className="w-full max-w-2xl bg-[#111111]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 overflow-hidden">
          
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

          {isConnected ? (
             <div className="p-6 space-y-6 animate-[fadeIn_0.3s_ease-out]">
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

               <div className="pt-4 border-t border-[#2a2a2a] grid grid-cols-2 gap-3">
                 <button onClick={() => openProposalModal('transfer')} className="py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)]">Propose Transfer</button>
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

      {/* 添加自定义代币弹窗 */}
      <AddTokenModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddToken}
      />

      {/* 👇 签名二次确认弹窗 */}
      <SignConfirmModal
        isOpen={!!signTarget}
        proposal={signTarget}
        walletAddress={address}
        isSubmitting={isSigning}
        error={signError}
        onCancel={closeSignConfirm}
        onConfirm={confirmSign}
        formatAddress={formatAddress}
      />

      {/* Proposal 弹窗 */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-white mb-2">{TYPE_META[proposalType].title}</h3>
            <p className="text-xs text-gray-400 mb-4">{TYPE_META[proposalType].description}</p>

            <div className="space-y-3 mb-4">
              {proposalType === 'changeOrgName' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">New Org Name</label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    placeholder="e.g. Consensys DAO"
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              )}

              {proposalType === 'transfer' && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Recipient (to)</label>
                    <input
                      type="text"
                      value={transferTo}
                      onChange={e => setTransferTo(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Coin</label>
                    <select
                      value={selectedCoinKey}
                      onChange={e => setSelectedCoinKey(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors"
                    >
                      {coinOptions.map(c => (
                        <option key={c.key} value={c.key}>
                          {c.symbol}{c.address ? ` (${c.address.slice(0, 6)}...${c.address.slice(-4)})` : ' (Native)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Amount {selectedCoin ? `(${selectedCoin.symbol})` : ''}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={transferValue}
                      onChange={e => setTransferValue(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                    {/* 👇 新增：可用余额展示 */}
                    {selectedCoin && (
                      <div className="flex justify-between items-center mt-1.5 px-1">
                        <span className="text-[10px] text-gray-500">
                          Available Balance:
                        </span>
                        <span 
                          className="text-[10px] text-gray-300 font-mono cursor-pointer hover:text-orange-400 transition-colors"
                          onClick={() => setTransferValue(currentAvailableBalance)}
                          title="Click to use max"
                        >
                          {currentAvailableBalance} {selectedCoin.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {proposalType === 'addMember' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Member Account</label>
                  <input
                    type="text"
                    value={memberAccount}
                    onChange={e => setMemberAccount(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors font-mono"
                  />
                </div>
              )}
            </div>

            {formError && (
              <div className="mb-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 break-all">
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsProposalModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitProposal}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App