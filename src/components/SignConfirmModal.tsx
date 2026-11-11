// src/components/SignConfirmModal.tsx
import type { Proposal } from './ProposalList'

interface SignConfirmModalProps {
  isOpen: boolean
  proposal: Proposal | null
  walletAddress?: `0x${string}`
  isSubmitting: boolean
  error: string
  onCancel: () => void
  onConfirm: () => void
  formatAddress: (addr?: string) => string
}

export function SignConfirmModal({
  isOpen,
  proposal,
  walletAddress,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
  formatAddress,
}: SignConfirmModalProps) {
  if (!isOpen || !proposal) return null

  const isApplicant =
    walletAddress &&
    walletAddress.toLowerCase() === proposal.applicant.toLowerCase()

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <h3 className="text-lg font-bold text-white mb-2">Confirm Signature</h3>
        <p className="text-xs text-gray-400 mb-4">
          You are about to sign this proposal on-chain. This action is irreversible.
        </p>

        <div className="space-y-2 text-xs bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-3 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="text-orange-400 font-mono">ORG_NAME_CHANG</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Enum</span>
            <span className="text-white font-mono">{proposal.enumValue}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">New name</span>
            <span className="text-white truncate" title={proposal.infos[0]}>
              {proposal.infos[0] || '(empty)'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Applicant</span>
            <span className="text-white font-mono truncate" title={proposal.applicant}>
              {formatAddress(proposal.applicant)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Your wallet</span>
            <span
              className={`font-mono truncate ${
                isApplicant ? 'text-emerald-400' : 'text-rose-400'
              }`}
              title={walletAddress}
            >
              {formatAddress(walletAddress)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Signatures</span>
            <span className="text-white font-mono">{proposal.signatures.length}</span>
          </div>
        </div>

        {!isApplicant && (
          <div className="mb-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
            ⚠️ Your wallet is not the applicant. The contract computes the hash from
            <span className="font-mono"> (enum, msg.sender)</span>, so this signature will revert.
          </div>
        )}

        {error && (
          <div className="mb-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 break-all">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
          >
            {isSubmitting ? 'Signing...' : 'Confirm Sign'}
          </button>
        </div>
      </div>
    </div>
  )
}