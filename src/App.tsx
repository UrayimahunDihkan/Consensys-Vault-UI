// src/App.tsx
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'

function App() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  // 获取当前地址的 ETH 余额
  const { data: balance } = useBalance({
    address: address,
    query: { enabled: isConnected },
  })

  // 地址截断展示：0x1234...abcd
  const formatAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    // 页面底层渐变背景（在 index.css 中已定义）
    <div className="flex items-center justify-center min-h-screen">
      
      {/* 核心毛玻璃卡片 */}
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300">
        
        {/* 头部 Logo 与标题 */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-4 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            {/* 闪电 SVG 图标 */}
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">Web3 Connect</h1>
          <p className="text-gray-400 text-sm">Connect your wallet to continue</p>
        </div>

        {/* 状态区分 */}
        {isConnected ? (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            {/* 信息面板 */}
            <div className="p-5 bg-black/40 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium">Account</span>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                  {/* 绿色呼吸灯 */}
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-sm text-gray-200">{formatAddress(address)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium">Network</span>
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-xs font-semibold">
                  {chain?.name || `Chain ${chainId}`}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-gray-400 text-sm font-medium">Balance</span>
                <span className="font-bold text-2xl text-white">
                  {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'} 
                  <span className="text-sm text-gray-400 ml-1.5 font-normal">{balance?.symbol || 'ETH'}</span>
                </span>
              </div>
            </div>

            {/* 断开按钮 */}
            <button
              onClick={() => disconnect()}
              className="w-full py-3.5 bg-white/5 hover:bg-rose-500/10 text-gray-300 hover:text-rose-400 font-medium rounded-xl border border-white/10 hover:border-rose-500/30 transition-all duration-200 active:scale-[0.98]"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 连接钱包按钮 */}
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  // Loading 动画
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  // 钱包图标
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                )}
                
                {isPending ? 'Connecting...' : `Connect Wallet`}

              </button>
            ))}
            
            <p className="text-center text-xs text-gray-500 mt-6">
              By connecting, you agree to our Terms of Service.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App