// src/components/ProposalList.tsx
import { useMemo } from 'react'

// 👇 这些类型后面可以移到 types.ts，先放这里也行
export type ProposalType = 'changeOrgName' | 'transfer' | 'addMember'

export interface Proposal {
  hash: `0x${string}`
  type: ProposalType
  applicant: `0x${string}`
  title: string
  description: string
  infos: readonly string[]
  signatures: readonly `0x${string}`[]
  signComplete: boolean
}

interface ProposalListProps {
  proposals: Proposal[]
  formatAddress: (addr?: string) => string
}

const TYPE_LABEL: Record<ProposalType, string> = {
  changeOrgName: 'NAME',
  transfer: 'TRANSFER',
  addMember: 'MEMBER',
}

export function ProposalList({ proposals, formatAddress }: ProposalListProps) {
  // 用 useMemo 包一下，避免每次父组件渲染都重新计算
  const rendered = useMemo(() => proposals, [proposals])

  if (rendered.length === 0) {
    return (
      <div className="hidden lg:flex flex-col gap-6 w-64">
        <div className="text-center p-6 border-2 border-dashed border-[#2a2a2a] rounded-xl text-gray-600 text-sm">
          No active proposals.<br />Use actions above.
        </div>
      </div>
    )
  }

  return (
    <div className="hidden lg:flex flex-col gap-6 w-64">
      {rendered.map((prop, index) => (
        <div
          key={prop.hash}
          className="relative bg-yellow-200 w-full p-5 rounded-lg shadow-xl text-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-[fadeIn_0.3s_ease-out]"
          style={{
            transform: `rotate(${index % 2 === 0 ? '-2deg' : '2deg'})`,
            zIndex: 10 - index,
          }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/50 backdrop-blur-sm -rotate-2 shadow-sm pointer-events-none"></div>

          <h3 className="font-bold text-sm mb-2 flex items-center justify-between border-b border-yellow-300/50 pb-2">
            <span className="truncate">{prop.title}</span>
            <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded font-mono">
              {TYPE_LABEL[prop.type]}
            </span>
          </h3>

          <p className="text-xs text-gray-700 leading-tight mb-2">
            {prop.description}
          </p>

          {/* SignatureInfo 详情 */}
          <div className="space-y-1.5 text-[10px] text-gray-700 mb-3">
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Applicant</span>
              <span className="font-mono truncate" title={prop.applicant}>
                {formatAddress(prop.applicant)}
              </span>
            </div>

            {prop.type === 'changeOrgName' && prop.infos[0] !== undefined && (
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">New name</span>
                <span className="truncate font-medium" title={prop.infos[0]}>
                  {prop.infos[0] || '(empty)'}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Signatures</span>
              <span className="font-mono">{prop.signatures.length}</span>
            </div>

            {prop.signatures.length > 0 && (
              <div>
                <div className="text-gray-500 mb-0.5">Signers</div>
                <div className="space-y-0.5">
                  {prop.signatures.map((s, i) => (
                    <div
                      key={`${prop.hash}-sig-${i}`}
                      className="font-mono truncate bg-white/40 px-1.5 py-0.5 rounded"
                      title={s}
                    >
                      {i + 1}. {formatAddress(s)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Status</span>
              <span className={prop.signComplete ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {prop.signComplete ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
            <span>{formatAddress(prop.applicant)}</span>
            <span className={`px-1.5 py-0.5 rounded ${prop.signComplete ? 'bg-emerald-200' : 'bg-white/50'}`}>
              {prop.signComplete ? 'DONE' : 'On-chain'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}