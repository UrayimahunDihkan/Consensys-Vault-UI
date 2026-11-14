// src/components/ProposalList.tsx
import { useMemo } from 'react'
import { formatUnits } from 'viem'

export type ProposalType = 'changeOrgName' | 'transfer' | 'addMember'

export interface Proposal {
  hash: `0x${string}`
  type: ProposalType
  applicant: `0x${string}`
  title: string
  description: string
  infos: readonly string[]
  // 👇 新增：转账专属字段
  transferTo?: `0x${string}`
  transferCurrency?: `0x${string}`
  transferAmount?: bigint
  
  signatures: readonly `0x${string}`[]
  execFlow: number  // 0=Pending, 1=Partial, 2=Completed, 3=Executed
  enumValue: number
}

interface ProposalListProps {
  proposals: Proposal[]
  formatAddress: (addr?: string) => string
  onSign: (proposal: Proposal) => void 
  onExecute: (proposal: Proposal) => void
  executingHash: string | null
}

const TYPE_LABEL: Record<ProposalType, string> = {
  changeOrgName: 'NAME',
  transfer: 'TRANSFER',
  addMember: 'MEMBER',
}

export function ProposalList({ 
  proposals, 
  formatAddress, 
  onSign, 
  onExecute, 
  executingHash 
}: ProposalListProps) {
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
      {rendered.map((prop, index) => {
        // 解析状态
        const isExecuted = prop.execFlow === 3
        const isSignComplete = prop.execFlow === 2
        const isPartial = prop.execFlow === 1

        return (
          <div
            key={prop.hash}
            className={`relative w-full p-5 rounded-lg shadow-xl text-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-[fadeIn_0.3s_ease-out] ${
              isExecuted ? 'bg-gray-300 opacity-80' : 'bg-yellow-200'
            }`}
            style={{
              transform: `rotate(${index % 2 === 0 ? '-2deg' : '2deg'})`,
              zIndex: 10 - index,
            }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/50 backdrop-blur-sm -rotate-2 shadow-sm pointer-events-none"></div>

            <h3 className="font-bold text-sm mb-2 flex items-center justify-between border-b border-black/10 pb-2">
              <span className="truncate">{prop.title}</span>
              <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded font-mono">
                {TYPE_LABEL[prop.type]}
              </span>
            </h3>

            <p className="text-xs text-gray-700 leading-tight mb-2">
              {prop.description}
            </p>

            <div className="space-y-1.5 text-[10px] text-gray-700 mb-3">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Applicant</span>
                <span className="font-mono truncate">{formatAddress(prop.applicant)}</span>
              </div>

              {/* 名字修改的展示 */}
              {prop.type === 'changeOrgName' && prop.infos[0] !== undefined && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">New name</span>
                  <span className="truncate font-medium">{prop.infos[0] || '(empty)'}</span>
                </div>
              )}

              {/* 👇 转账的展示 */}
              {prop.type === 'transfer' && prop.transferTo && (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">To</span>
                    <span className="font-mono truncate" title={prop.transferTo}>
                      {formatAddress(prop.transferTo)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-mono font-medium">
                      {/* 这里暂用 18 位精度展示，如果是 USDT 等 6 位精度的代币，数值可能会显示很长，后续可在 App.tsx 中结合 token 列表做精确转换 */}
                      {prop.transferAmount ? formatUnits(prop.transferAmount, 18) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Token</span>
                    <span className="font-mono truncate" title={prop.transferCurrency}>
                      {prop.transferCurrency === '0x0000000000000000000000000000000000000000' ? 'RBTC' : formatAddress(prop.transferCurrency)}
                    </span>
                  </div>
                </>
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
                <span className={`font-semibold ${
                  isExecuted ? 'text-gray-500' : 
                  isSignComplete ? 'text-emerald-700' : 
                  isPartial ? 'text-blue-600' : 'text-amber-700'
                }`}>
                  {isExecuted ? 'Executed' : 
                   isSignComplete ? 'Sign completed' : 
                   isPartial ? 'Sign partially completed' : 'Pending sign'}
                </span>
              </div>
            </div>

            {/* 👇 签名按钮：现在把 transfer 也加进来了 */}
            {(prop.type === 'changeOrgName' || prop.type === 'transfer') && (prop.execFlow === 0 || prop.execFlow === 1) && (
              <button
                onClick={() => onSign(prop)}
                className="w-full py-1 text-emerald-800 hover:bg-emerald-800/10 hover:text-emerald-900 text-[11px] font-bold tracking-widest uppercase rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Sign Here
              </button>
            )}

            {/* 👇 执行按钮：现在把 transfer 也加进来了 */}
            {(prop.type === 'changeOrgName' || prop.type === 'transfer') && isSignComplete && !isExecuted && (
              <button
                onClick={() => onExecute(prop)}
                disabled={executingHash === prop.hash}
                className="w-full py-1 text-blue-900 hover:bg-blue-900/10 hover:text-blue-950 disabled:opacity-50 text-[11px] font-bold tracking-widest uppercase rounded transition-colors flex items-center justify-center gap-1.5"
              >
                {executingHash === prop.hash ? (
                  'Executing...'
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Execute
                  </>
                )}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}