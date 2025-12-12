import { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import PoolInfo from './components/PoolInfo';
import SwapInterface from './components/SwapInterface';
import LiquidityInterface from './components/LiquidityInterface';
import ThemeToggle from './components/ThemeToggle';
import TokenBalances from './components/TokenBalances';
import TransactionHistory from './components/TransactionHistory'; 

function App() {
  const [walletData, setWalletData] = useState(null);

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0d1117] dark:to-[#010409]">
    {/* Sticky Header */}
    <div className="sticky top-0 z-50 bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">SimpleDEX</h1>
            </div>  
          </div>

          {/* Right side - Sepolia + Theme */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
              Sepolia
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>

    {/* Rest of content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <WalletConnect onConnect={setWalletData} />

        {walletData ? (
          <div className="space-y-4">
            <TokenBalances signer={walletData.signer} />
            <PoolInfo provider={walletData.provider} />
            <SwapInterface signer={walletData.signer} />
            <LiquidityInterface signer={walletData.signer} />
            <TransactionHistory provider={walletData.provider} />
          </div>
        ) : (
          <div className="mt-12 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-3xl p-16 text-center">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get started by connecting your wallet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
