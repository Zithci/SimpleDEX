import { useState, useEffect } from 'react';
import { Contract } from 'ethers'; // Hapus formatEther kalo gak dipake buat formatting angka detail
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';

// 1. TERIMA PROPS refreshTrigger
export default function TransactionHistory({ provider, refreshTrigger }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Kalau provider gak ada, reset.
    if (!provider) {
      setTransactions([]);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, provider);
        const signer = await provider.getSigner();
        const myAddress = await signer.getAddress();
        
        const currentBlock = await provider.getBlockNumber();
        // Scan 5000 block terakhir aja biar enteng
        const fromBlock = Math.max(0, currentBlock - 5000); 

        // 2. FILTERING: Cuma ambil transaksi punya KITA (myAddress)
        // Biar privacy aman dan gak kecampur orang lain
        
        // Setup Filter untuk 3 Event utama
        const filterSwap = dex.filters.Swap ? dex.filters.Swap(myAddress) : 'Swap';
        const filterAdd = dex.filters.LiquidityAdded ? dex.filters.LiquidityAdded(myAddress) : 'LiquidityAdded';
        const filterRemove = dex.filters.LiquidityRemoved ? dex.filters.LiquidityRemoved(myAddress) : 'LiquidityRemoved';

        // Tarik data paralel biar cepet
        const [swaps, adds, removes] = await Promise.all([
          dex.queryFilter(filterSwap, fromBlock, currentBlock),
          dex.queryFilter(filterAdd, fromBlock, currentBlock),
          dex.queryFilter(filterRemove, fromBlock, currentBlock)
        ]);

        // Format data Swap
        const formatEvents = (events, type) => events.map(e => ({
          type,
          blockNumber: e.blockNumber,
          hash: e.transactionHash,
          timestamp: 0 // Nanti bisa ditambah logic fetchBlockTimestamp kalo mau
        }));

        const allEvents = [
          ...formatEvents(swaps, 'Swap'),
          ...formatEvents(adds, 'Add Liquidity'),
          ...formatEvents(removes, 'Remove Liquidity')
        ];

        // Urutin dari block paling gede (Terbaru)
        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
        
        // Ambil 10 teratas
        setTransactions(allEvents.slice(0, 10));

      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

  // 3. DEPENDENCY ARRAY: Masukin refreshTrigger di sini!
  // Tiap angka trigger berubah, fungsi loadHistory jalan ulang.
  }, [provider, refreshTrigger]); 


  // --- RENDER (JSX MODE) ---
  
  if (!provider) return null;

  return (
    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-black dark:text-white">Recent Transactions</h3>
        {loading && <span className="text-xs text-blue-500 animate-pulse">Syncing...</span>}
      </div>

      {loading && transactions.length === 0 ? (
        // Skeleton Loading UI
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-gray-100 dark:bg-[#0d1117] rounded-xl border border-gray-200 dark:border-[#30363d]" />
          <div className="h-16 bg-gray-100 dark:bg-[#0d1117] rounded-xl border border-gray-200 dark:border-[#30363d]" />
        </div>
      ) : transactions.length === 0 ? (
        // Empty State
        <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-[#30363d] rounded-xl">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No transactions yet</p>
        </div>
      ) : (
        // Transaction List
        <div className="space-y-2">
          {transactions.map((tx, i) => {
            // Styling logic
            let bgColor = 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            let icon = '🔄';
            
            if (tx.type === 'Add Liquidity') {
              bgColor = 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
              icon = '➕';
            } else if (tx.type === 'Remove Liquidity') {
              bgColor = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
              icon = '➖';
            }

            return (
              <a
                key={`${tx.hash}-${i}`}
                href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-[#21262d] border border-transparent hover:border-blue-500/20 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${bgColor}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tx.type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      Block #{tx.blockNumber}
                    </p>
                  </div>
                </div>
                
                {/* Arrow Icon */}
                <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}