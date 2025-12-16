import { useState, useCallback } from 'react';
import WalletConnect from './components/WalletConnect';
import PoolInfo from './components/PoolInfo';
import SwapInterface from './components/SwapInterface';
import LiquidityInterface from './components/LiquidityInterface';
import ThemeToggle from './components/ThemeToggle';
import TokenBalances from './components/TokenBalances';
import TransactionHistory from './components/TransactionHistory'; 
import RemoveLiquidityInterface from './components/RemoveLiquidityInterface';


function App() {
  const [walletData, setWalletData] = useState(null);
  console.log("Re-Render App");
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('swap');

  const handleTxSuccess = useCallback(() => {
    console.log("tx succeed");
    setRefreshTrigger(prev => prev + 1);

    setTimeout(() => {
      console.log("5 sec passed");
      setRefreshTrigger(prev => prev + 1);
    }, 5000);

    setTimeout(() => {
      console.log("final 5 sec");
      setRefreshTrigger(prev => prev + 1);
    }, 10000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0d1117] dark:to-[#010409]">
      <div className="sticky top-0 z-50 bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
                Sepolia
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <WalletConnect onConnect={setWalletData} />

{walletData ? (
  <div className="space-y-4">
    {/* Balance & Pool tetep di atas - always visible */}
    <TokenBalances 
      signer={walletData.signer}
      refreshTrigger={refreshTrigger}
    />

    <PoolInfo 
      provider={walletData.provider}
      refreshTrigger={refreshTrigger}
    />

    {/* TAB NAVIGATION - user pilih Swap atau Liquidity */}
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#0d1117] rounded-2xl">
      <button
        onClick={() => setActiveTab('swap')} // klik = ganti tab ke 'swap'
        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
          activeTab === 'swap' // cek: tab aktif = swap?
            ? 'bg-white dark:bg-[#161b22] text-black dark:text-white shadow-lg' // yes = style aktif
            : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white' // no = style inactive
        }`}
      >
        Swap
      </button>
      <button
        onClick={() => setActiveTab('liquidity')} // klik = ganti tab ke 'liquidity'
        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
          activeTab === 'liquidity' // cek: tab aktif = liquidity?
            ? 'bg-white dark:bg-[#161b22] text-black dark:text-white shadow-lg'
            : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
        }`}
      >
        Liquidity
      </button>
    </div>

    {/* CONDITIONAL RENDERING - tampilkan component sesuai tab aktif */}
    {activeTab === 'swap' && ( // kalo tab = 'swap', render SwapInterface
      <SwapInterface 
        signer={walletData.signer}
        onTxSuccess={handleTxSuccess}
      />
    )}

    {activeTab === 'liquidity' && ( // kalo tab = 'liquidity', render Add + Remove
      <div className="space-y-4">
        <LiquidityInterface 
          signer={walletData.signer}
          onTxSuccess={handleTxSuccess} 
        />
        <RemoveLiquidityInterface 
          signer={walletData.signer}
          onTxSuccess={handleTxSuccess}
        />
      </div>
    )}

    {/* Transaction history tetep di bawah - always visible */}
    <TransactionHistory 
      provider={walletData.provider} 
      refreshTrigger={refreshTrigger}
    />
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
