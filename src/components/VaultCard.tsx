// src/components/VaultCard.tsx
import { formatUnits } from 'viem'
import { formatAddress, formatLongAddress } from '../utils/format'
import { useState } from 'react'

// 引入相关类型
interface Token { address: string; symbol: string; name: string; decimals: number }

interface VaultCardProps {
  isConnected: boolean
  chainName?: string
  chainId: number
  orgName?: string
  isOrgNameLoading: boolean
  formattedNative: string
  isNativeLoading: boolean
  tokens: Token[]
  tokenBalances: any // 这里可以用更精确的 viem 类型
  isTokensLoading: boolean
  allSigners?: readonly `0x${string}`[]
  walletAddress?: string
  
  onOpenTransfer: () => void
  onOpenAddToken: () => void
  onConnect: () => void
  onDisconnect: () => void
  isPending: boolean
}

export function VaultCard({
  isConnected, chainName, chainId, orgName, isOrgNameLoading,
  formattedNative, isNativeLoading, tokens, tokenBalances, isTokensLoading, allSigners, walletAddress,
  onOpenTransfer, onOpenAddToken, onConnect, onDisconnect, isPending
}: VaultCardProps) {
  const [copied, setCopied] = useState(false)
  const [copiedSigner, setCopiedSigner] = useState<string | null>(null)

  const SMART_WALLET_ADDRESS = import.meta.env.VITE_SMART_WALLET_ADDRESS as `0x${string}`

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(SMART_WALLET_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {}
  }

  const handleCopySigner = async (signer: string) => {
    try {
      await navigator.clipboard.writeText(signer)
      setCopiedSigner(signer)
      setTimeout(() => setCopiedSigner(null), 2000)
    } catch (err) {}
  }

  return (
    <div className="w-full max-w-2xl bg-[#111111]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 overflow-hidden">
      
      {/* Header */}
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
          <button onClick={onDisconnect} className="px-4 py-2 text-sm bg-[#222] hover:bg-rose-500/10 text-gray-300 hover:text-rose-400 border border-[#333] rounded-lg transition-all">Disconnect</button>
        ) : (
          <button onClick={onConnect} disabled={isPending} className="px-5 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-lg">{isPending ? '...' : 'Connect'}</button>
        )}
      </div>

      {/* Body */}
      {isConnected ? (
        <div className="p-6 space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Vault Address */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-[#2a2a2a]">
            <div>
              <div className="text-xs text-gray-500 mb-1">Vault Address</div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center gap-2 cursor-pointer group" onClick={handleCopyAddress}>
                  <span className="font-mono text-sm text-gray-200 group-hover:text-orange-400 transition-colors">{formatLongAddress(SMART_WALLET_ADDRESS)}</span>
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-[fadeIn_0.2s_ease-out]">Copied!</span>}
                </div>
                <span className="px-2 py-0.5 bg-[#222] text-gray-300 border border-[#333] text-[10px] font-bold rounded uppercase">{chainName || `Chain ${chainId}`}</span>
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

          {/* Vault Assets */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Vault Assets</h2>
            <div className="space-y-2">
              {/* Native */}
              <div className="flex justify-between items-center p-4 bg-[#1a1a1a]/50 hover:bg-[#222] rounded-xl transition-colors border border-[#2a2a2a] hover:border-[#444] cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xl shadow-inner text-orange-400">₿</div>
                  <div><div className="font-bold text-white">Rootstock</div><div className="text-xs text-gray-400">Native Currency</div></div>
                </div>
                <div className="text-right"><div className="font-bold text-white">{isNativeLoading ? '...' : formattedNative}</div><div className="text-xs text-gray-400">RBTC</div></div>
              </div>
              {/* ERC20s */}
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

          {/* Vault Signers */}
          <div className="pt-4 border-t border-[#2a2a2a]">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Vault Signers
            </h2>
            <div className="flex flex-wrap gap-2">
              {allSigners && allSigners.length > 0 ? (
                allSigners.map((signer) => (
                  <div 
                    key={signer}
                    onClick={() => handleCopySigner(signer)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1a]/80 border border-[#333] hover:border-[#555] rounded-lg text-xs font-mono text-gray-300 cursor-pointer transition-colors group relative"
                    title={signer}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    {formatAddress(signer)}
                    {copiedSigner === signer && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none">
                        Copied!
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 italic py-2">No signers found.</div>
              )}
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="pt-4 border-t border-[#2a2a2a] grid grid-cols-2 gap-3 mt-6">
            <button onClick={onOpenTransfer} className="py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)]">Propose Transfer</button>
            <button onClick={onOpenAddToken} className="py-3 bg-[#222] hover:bg-[#333] text-white font-medium rounded-xl border border-[#333] transition-all">Track New Asset</button>
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
  )
}