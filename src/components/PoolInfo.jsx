import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';

export default function PoolInfo({ provider }) {
  const [reserves, setReserves] = useState({ tokenA: '0', tokenB: '0' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!provider) {
      setReserves({ tokenA: '0', tokenB: '0' });
      setLoading(false);
      return;
    }

    const loadReserves = async () => {
      try {
        setError(null);
        const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, provider);
        const [reserveA, reserveB] = await dex.getReserves();

        setReserves({
          tokenA: reserveA.toString(),
          tokenB: reserveB.toString()
        });
        setLoading(false);
      } catch (err) {
        console.error('Error loading reserves:', err);
        if (err.code === 'NETWORK_ERROR') {
          setError('Network switched - reconnect wallet');
        } else {
          setError('Failed to load pool data');
        }
        setLoading(false);
      }
    };

    loadReserves();
    const interval = setInterval(loadReserves, 10000);
    return () => clearInterval(interval);
  }, [provider]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">Disconnect and reconnect your wallet</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-6 mb-4 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-[#30363d] rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-200 dark:bg-[#30363d] rounded-xl"></div>
            <div className="h-24 bg-gray-200 dark:bg-[#30363d] rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalLiquidity = Number(reserves.tokenA) + Number(reserves.tokenB);
  const exchangeRate = reserves.tokenA !== '0' 
    ? (Number(reserves.tokenB) / Number(reserves.tokenA)).toFixed(4)
    : '0';

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#161b22] dark:to-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-2xl p-6 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-black dark:text-white mb-1">Liquidity Pool</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Value Locked</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Cached</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Token A */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">TKNA</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-1">
            {(Number(reserves.tokenA) / 1e18).toLocaleString(undefined, { 
              maximumFractionDigits: 2,
              minimumFractionDigits: 2 
            })}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {totalLiquidity > 0 ? ((Number(reserves.tokenA) / totalLiquidity) * 100).toFixed(1) : '0'}% of pool
          </p>
        </div>

        {/* Token B */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-900/30 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-300">TKNB</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-200 mb-1">
            {(Number(reserves.tokenB) / 1e18).toLocaleString(undefined, { 
              maximumFractionDigits: 2,
              minimumFractionDigits: 2 
            })}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {totalLiquidity > 0 ? ((Number(reserves.tokenB) / totalLiquidity) * 100).toFixed(1) : '0'}% of pool
          </p>
        </div>
      </div>

      {/* Exchange Rate */}
      <div className="pt-4 border-t border-gray-200 dark:border-[#30363d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Exchange Rate</span>
          </div>
          <span className="text-sm font-bold text-black dark:text-white">
            1 TKNA = {exchangeRate} TKNB
          </span>
        </div>
      </div>
    </div>
  );
}
