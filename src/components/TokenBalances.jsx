import { useState, useEffect, useRef } from 'react';
import { Contract, formatEther } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';

export default function TokenBalances({ signer }) {
  const [balances, setBalances] = useState({ tokenA: '0', tokenB: '0' });
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!signer) {
      setBalances({ tokenA: '0', tokenB: '0' });
      setLoading(false);
      setAddress(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const loadBalances = async () => {
      try {
        const userAddress = await signer.getAddress();
        setAddress(userAddress);

        const tokenA = new Contract(CONTRACTS.TokenA, ABIS.TokenA, signer);
        const tokenB = new Contract(CONTRACTS.TokenB, ABIS.TokenB, signer);

        const [balA, balB] = await Promise.all([
          tokenA.balanceOf(userAddress),
          tokenB.balanceOf(userAddress)
        ]);

        setBalances({
          tokenA: formatEther(balA),
          tokenB: formatEther(balB)
        });
        setLoading(false);
      } catch (err) {
        console.error('Balance error:', err);
        setBalances({ tokenA: '0', tokenB: '0' });
        setLoading(false);
      }
    };

    // Load immediately
    loadBalances();

    // Poll only for first 30 seconds, then stop
    let pollCount = 0;
    intervalRef.current = setInterval(() => {
      pollCount++;
      if (pollCount > 6) { // 6 * 5s = 30 seconds
        clearInterval(intervalRef.current);
        console.log('Stopped polling balances after 30s');
        return;
      }
      loadBalances();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [signer]);

  if (!signer) return null;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-5 mb-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-[#30363d] rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-200 dark:bg-[#30363d] rounded-xl"></div>
            <div className="h-24 bg-gray-200 dark:bg-[#30363d] rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white dark:from-[#161b22] dark:to-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-2xl p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-black dark:text-white">Your Wallet</h4>
          {address && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Cached</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Token A Balance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/5 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">TKNA</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {Number(balances.tokenA).toLocaleString(undefined, { 
              maximumFractionDigits: 2,
              minimumFractionDigits: 2 
            })}
          </p>
        </div>

        {/* Token B Balance */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/5 border border-purple-200 dark:border-purple-900/30 rounded-xl p-4 hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">TKNB</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {Number(balances.tokenB).toLocaleString(undefined, { 
              maximumFractionDigits: 2,
              minimumFractionDigits: 2 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
