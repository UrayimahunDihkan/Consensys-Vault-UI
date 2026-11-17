// src/App.tsx
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useReadContracts, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { formatUnits, isAddress } from 'viem'
import { useState, useMemo } from 'react'
import { SmartWalletABI } from './abi/SmartWalletABI' 
import { ProposalSignABI } from './abi/ProposalSignABI' 
import { ProposalList } from './components/ProposalList'
import type { Proposal, ProposalType } from './components/ProposalList'
import { ProposalModal } from './components/ProposalModal'
import { AddTokenModal } from './components/AddTokenModal'
import { TopActions } from './components/TopActions'
import { SignConfirmModal } from './components/SignConfirmModal'
import { VaultCard } from './components/VaultCard'
import { formatAddress } from './utils/format'

const SMART_WALLET_ADDRESS = import.meta.env.VITE_SMART_WALLET_ADDRESS as `0x${string}`
const PROPOSAL_SIGN_ADDRESS = import.meta.env.VITE_PROPOSAL_SIGN_ADDRESS as `0x${string}`

const INITIAL_TOKENS = [
  {
    address: '0x5a767e7A1A42e5B55A6409024D09D6417AC47B2F', // Rootstock USDT
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  }
]

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

const ENUM_TO_TYPE: Record<number, ProposalType> = {
  0: 'changeOrgName',
  1: 'transfer',
  2: 'addMember',
}

const TYPE_META: Record<ProposalType, { title: string; description: string }> = {
  changeOrgName: { title: 'Change Org Name', description: 'Proposal to update the DAO name.' },
  transfer: { title: 'Transfer Funds', description: 'Proposal to transfer assets out of the vault.' },
  addMember: { title: 'Membership', description: 'Proposal to add or remove a signer.' },
}

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

  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [proposalType, setProposalType] = useState<ProposalType>('changeOrgName')

  const [selectedCoinKey, setSelectedCoinKey] = useState<string>('native')

  const [signTarget, setSignTarget] = useState<Proposal | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const [executingHash, setExecutingHash] = useState<string | null>(null)

  const coinOptions: CoinOption[] = useMemo(() => [
    { key: 'native', symbol: 'RBTC', decimals: 18 },
    ...tokens.map(t => ({ key: t.address, symbol: t.symbol, decimals: t.decimals, address: t.address as `0x${string}` })),
  ], [tokens])

  const selectedCoin = coinOptions.find(c => c.key === selectedCoinKey)

  const { data: orgName, isLoading: isOrgNameLoading, refetch: refetchOrgName } = useReadContract({
    address: SMART_WALLET_ADDRESS, abi: SmartWalletABI, functionName: 'orgName',
    query: { enabled: isConnected },
  });

  const { data: nativeBalance, isLoading: isNativeLoading } = useBalance({
    address: SMART_WALLET_ADDRESS, query: { enabled: isConnected },
  })

  const { data: tokenBalances, isLoading: isTokensLoading, refetch: refetchBalances } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: token.address as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [SMART_WALLET_ADDRESS],
    })),
    query: { enabled: isConnected && tokens.length > 0 },
  })

  const { data: onChainProposals, refetch: refetchProposals } = useReadContract({
    address: PROPOSAL_SIGN_ADDRESS, abi: ProposalSignABI, functionName: 'allProposals',
    query: { enabled: isConnected },
  })

  // 👇 新增：获取所有的 Signers
  const { data: allSigners, refetch: refetchSigners } = useReadContract({
    address: PROPOSAL_SIGN_ADDRESS,
    abi: ProposalSignABI,
    functionName: 'allMembers',
    query: { enabled: isConnected },
  })

  const proposals: Proposal[] = useMemo(() => {
    if (!onChainProposals) return []
    return onChainProposals.map((p, idx) => {
      const enumValue = Number(p.proposal)
      const type = ENUM_TO_TYPE[enumValue] ?? 'changeOrgName'
      const meta = TYPE_META[type]
      
      let desc = meta.description
      if (type === 'changeOrgName' && p.infos[0]) {
        desc = `→ New name: "${p.infos[0]}"`
      } else if (type === 'addMember') {
        const isAdd = Number(p.membershipProposal) === 0
        desc = `→ ${isAdd ? 'Add' : 'Remove'} signer: ${p.membershipAddr ? p.membershipAddr.slice(0,6)+'...' : ''}`
      }

      return {
        hash: `0x${idx}` as `0x${string}`,
        type,
        applicant: p.applicant,
        title: meta.title,
        description: desc,
        infos: p.infos,
        transferTo: p.transferTo,
        transferCurrency: p.transferCurrency,
        transferAmount: p.transferAmount,
        membershipAddr: p.membershipAddr,
        membershipProposal: p.membershipProposal,
        signatures: p.signatures,
        execFlow: Number(p.execFlow),
        enumValue,
      }
    })
  }, [onChainProposals])

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
        address: PROPOSAL_SIGN_ADDRESS, abi: ProposalSignABI, functionName: 'signProposal',
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

  const handleExecute = async (proposal: Proposal) => {
    setExecutingHash(proposal.hash)
    try {
      if (proposal.type === 'changeOrgName') {
        if (!proposal.infos[0]) return
        const hash = await writeContractAsync({
          address: SMART_WALLET_ADDRESS, abi: SmartWalletABI, functionName: 'setOrgName',
          args: [proposal.infos[0]],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
        await Promise.all([refetchOrgName(), refetchProposals()])
      } 
      // 👇 加上 transfer 的执行逻辑
      else if (proposal.type === 'transfer') {
        const hash = await writeContractAsync({
          address: PROPOSAL_SIGN_ADDRESS, 
          abi: ProposalSignABI, 
          functionName: 'execTransfer',
          args: [],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
        // 执行完 transfer 后，资产余额会变，需要刷新余额和提案列表
        await Promise.all([refetchProposals(), refetchBalances()])
      } 
      else if (proposal.type === 'addMember') {
        const hash = await writeContractAsync({
          address: PROPOSAL_SIGN_ADDRESS, abi: ProposalSignABI, functionName: 'execMembership',
          args: [],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
        await Promise.all([refetchProposals(), refetchSigners()])
      }
    } catch (e: any) {
      console.error(e)
      alert(e?.shortMessage || e?.message || 'Execute failed')
    } finally {
      setExecutingHash(null)
    }
  }

  const isCurrentUserSigner = useMemo(() => {
    if (!address || !allSigners) return false
    return allSigners.some(
      (signer) => signer.toLowerCase() === address.toLowerCase()
    )
  }, [address, allSigners])

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

    const newToken: Token = { address: tokenAddress, symbol: symbol as string, name: 'Custom Asset', decimals: Number(decimals) }

    setTokens(prev => [...prev, newToken])
    setIsAddModalOpen(false)
    setTimeout(() => refetchBalances(), 500)
  }

  const openProposalModal = (type: ProposalType) => {
    setProposalType(type)
    // setFormError('')
    // setNewOrgName('')
    // setTransferTo('')
    // setTransferValue('')
    setSelectedCoinKey('native')
    // setMemberAccount('')
    // setMembershipAction(0)
    setIsProposalModalOpen(true)
  }

  let currentAvailableBalance = '0.0000'
  if (selectedCoin) {
    if (selectedCoin.key === 'native') {
      currentAvailableBalance = formattedNative
    } else {
      const tokenIndex = tokens.findIndex(t => t.address.toLowerCase() === selectedCoin.address?.toLowerCase())
      if (tokenIndex !== -1 && tokenBalances?.[tokenIndex]?.status === 'success') {
        const balanceData = tokenBalances[tokenIndex]
        currentAvailableBalance = parseFloat(formatUnits(BigInt(balanceData.result), selectedCoin.decimals)).toFixed(4)
      }
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 relative gap-8">
      
      {isConnected && <TopActions onOpenProposal={openProposalModal} />}

      <div className="flex items-start justify-center w-full max-w-6xl gap-8 relative mt-4">
        
        {isConnected && (
        <ProposalList 
            proposals={proposals} 
            formatAddress={formatAddress} 
            onSign={openSignConfirm} 
            onExecute={handleExecute} 
            executingHash={executingHash} 
            isCurrentUserSigner={isCurrentUserSigner} 
          />
        )}

        <VaultCard 
          isConnected={isConnected}
          chainName={chain?.name}
          chainId={chainId}
          orgName={orgName}
          isOrgNameLoading={isOrgNameLoading}
          formattedNative={formattedNative}
          isNativeLoading={isNativeLoading}
          tokens={tokens}
          tokenBalances={tokenBalances}
          isTokensLoading={isTokensLoading}
          allSigners={allSigners}
          walletAddress={address}
          onOpenTransfer={() => openProposalModal('transfer')}
          onOpenAddToken={() => setIsAddModalOpen(true)}
          onConnect={() => connect({ connector: connectors[0] })}
          onDisconnect={() => disconnect()}
          isPending={isPending}
        />
      </div>

      <AddTokenModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddToken}
      />

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
      <ProposalModal
        isOpen={isProposalModalOpen}
        type={proposalType}
        coinOptions={coinOptions}
        currentAvailableBalance={currentAvailableBalance}
        onClose={() => setIsProposalModalOpen(false)}
        onSubmitted={refetchProposals}
      />

    </div>
  )
}

export default App