// src/components/AddTokenModal.tsx
import { useState } from 'react'

interface AddTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (address: string) => Promise<void> | void
}

export function AddTokenModal({ isOpen, onClose, onSubmit }: AddTokenModalProps) {
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleClose = () => {
    // 关闭时重置内部状态
    setNewTokenAddress('')
    setError('')
    setIsAdding(false)
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    setIsAdding(true)
    try {
      await onSubmit(newTokenAddress)
      // 成功后由 App 关闭弹窗，这里只重置输入
      setNewTokenAddress('')
    } catch (e: any) {
      console.error(e)
      setError(e?.shortMessage || e?.message || 'Failed to add token')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <h3 className="text-lg font-bold text-white mb-2">Track New Asset</h3>
        <p className="text-xs text-gray-400 mb-4">Enter ERC-20 contract address to monitor.</p>

        <input
          type="text"
          value={newTokenAddress}
          onChange={(e) => setNewTokenAddress(e.target.value)}
          placeholder="0x..."
          className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition-colors mb-2 font-mono"
        />

        {error && (
          <div className="mb-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 break-all">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isAdding}
            className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isAdding || !newTokenAddress}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
          >
            {isAdding ? '...' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  )
}