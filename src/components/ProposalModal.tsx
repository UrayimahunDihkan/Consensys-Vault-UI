// src/components/ProposalModal.tsx
import { useState, useEffect } from 'react'
import { isAddress, parseUnits } from 'viem'
import type { ProposalType } from './ProposalList'
import { usePublicClient, useWriteContract } from 'wagmi'
import { ProposalSignABI } from '../abi/ProposalSignABI'

const PROPOSAL_SIGN_ADDRESS = import.meta.env.VITE_PROPOSAL_SIGN_ADDRESS as `0x${string}`

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

interface ProposalModalProps {
  isOpen: boolean
  type: ProposalType
  coinOptions: CoinOption[]
  currentAvailableBalance: string
  onClose: () => void
  onSubmitted: () => void
}

export function ProposalModal({ 
  isOpen, type, coinOptions, currentAvailableBalance, onClose, onSubmitted 
}: ProposalModalProps) {
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // 表单状态移入组件内部
  const [newOrgName, setNewOrgName] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferValue, setTransferValue] = useState('')
  const [selectedCoinKey, setSelectedCoinKey] = useState<string>('native')
  const [memberAccount, setMemberAccount] = useState('')
  const [membershipAction, setMembershipAction] = useState<number>(0)

  // 每次打开弹窗时重置状态
  useEffect(() => {
    if (isOpen) {
      setFormError('')
      setNewOrgName('')
      setTransferTo('')
      setTransferValue('')
      setSelectedCoinKey('native')
      setMemberAccount('')
      setMembershipAction(0)
    }
  }, [isOpen])

  const selectedCoin = coinOptions.find(c => c.key === selectedCoinKey)

  if (!isOpen) return null

  const validateForm = (): string | null => {
    if (type === 'changeOrgName' && !newOrgName.trim()) return 'Org name cannot be empty'
    if (type === 'transfer') {
      if (!isAddress(transferTo)) return 'Invalid recipient address'
      if (!transferValue || Number(transferValue) <= 0) return 'Amount must be > 0'
      if (!selectedCoin) return 'Please select a coin'
    }
    if (type === 'addMember' && !isAddress(memberAccount)) return 'Invalid member address'
    return null
  }

  const submitProposal = async () => {
    const err = validateForm()
    if (err) { setFormError(err); return }

    setFormError('')
    setIsSubmitting(true)

    try {
      if (type === 'changeOrgName') {
        const hash = await writeContractAsync({
          address: PROPOSAL_SIGN_ADDRESS, abi: ProposalSignABI, functionName: 'proposeOrgNameChange', args: [newOrgName],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      } 
      else if (type === 'transfer') {
        if (!selectedCoin) throw new Error('Coin not selected')
        const amountInWei = parseUnits(transferValue, selectedCoin.decimals)
        const tokenAddress = selectedCoin.address ?? '0x0000000000000000000000000000000000000000'
        const hash = await writeContractAsync({
          address: PROPOSAL_SIGN_ADDRESS, abi: ProposalSignABI, functionName: 'proposeTransfer',
          args: [transferTo as `0x${string}`, tokenAddress as `0x${string}`, amountInWei],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      } 
      else if (type === 'addMember') {
        const hash = await writeContractAsync({
          address: PROPOSAL_SIGN_ADDRESS, abi: ProposalSignABI, functionName: 'proposeMembership',
          args: [memberAccount as `0x${string}`, membershipAction],
        })
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      }

      onSubmitted() // 通知父组件刷新数据
      onClose()     // 关闭弹窗
    } catch (e: any) {
      console.error(e)
      setFormError(e?.shortMessage || e?.message || 'Transaction failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <h3 className="text-lg font-bold text-white mb-2">{TYPE_META[type].title}</h3>
        <p className="text-xs text-gray-400 mb-4">{TYPE_META[type].description}</p>

        <div className="space-y-3 mb-4">
          {type === 'changeOrgName' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">New Org Name</label>
              <input
                type="text" value={newOrgName} onChange={e => setNewOrgName(e.target.value)}
                placeholder="e.g. Consensys DAO"
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          )}

          {type === 'transfer' && (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Recipient (to)</label>
                <input
                  type="text" value={transferTo} onChange={e => setTransferTo(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Coin</label>
                <select
                  value={selectedCoinKey} onChange={e => setSelectedCoinKey(e.target.value)}
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
                  type="number" step="any" min="0" value={transferValue} onChange={e => setTransferValue(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors font-mono"
                />
                {selectedCoin && (
                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <span className="text-[10px] text-gray-500">Available Balance:</span>
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

          {type === 'addMember' && (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Action</label>
                <select
                  value={membershipAction} onChange={e => setMembershipAction(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors mb-3"
                >
                  <option value={0}>Add Member</option>
                  <option value={1}>Remove Member</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Member Account</label>
                <input
                  type="text" value={memberAccount} onChange={e => setMemberAccount(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>
            </>
          )}
        </div>

        {formError && (
          <div className="mb-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 break-all">
            {formError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose} disabled={isSubmitting}
            className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submitProposal} disabled={isSubmitting}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </div>
      </div>
    </div>
  )
}