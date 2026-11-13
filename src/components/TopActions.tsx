// src/components/TopActions.tsx
import type { ProposalType } from './ProposalList'

interface TopActionsProps {
  onOpenProposal: (type: ProposalType) => void
}

export function TopActions({ onOpenProposal }: TopActionsProps) {
  return (
    <div className="w-full max-w-4xl flex items-center justify-end gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
      <span className="text-sm text-gray-400 mr-auto pl-2">Proposals:</span>

      <button
        onClick={() => onOpenProposal('changeOrgName')}
        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        org name
      </button>

      <button
        onClick={() => onOpenProposal('transfer')}
        className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        transfer
      </button>

      <button
        onClick={() => onOpenProposal('addMember')}
        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        membership
      </button>
    </div>
  )
}