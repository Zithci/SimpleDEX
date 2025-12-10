import { useState } from 'react';
import { Contract, parseEther } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';
import Spinner from './Spinner';

export default function LiquidityInterface({ signer }) {
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState('');

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB || !signer) return;

    setAdding(true);
    setStatus('Approving tokens...');

    try {
      const tokenA = new Contract(CONTRACTS.TokenA, ABIS.TokenA, signer);
      const tokenB = new Contract(CONTRACTS.TokenB, ABIS.TokenB, signer);
      const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);

      const amountAWei = parseEther(amountA);
      const amountBWei = parseEther(amountB);

      setStatus('Approving TKNA...');
      const approveATx = await tokenA.approve(CONTRACTS.SimpleDEX, amountAWei);
      await approveATx.wait();

      setStatus('Approving TKNB...');
      const approveBTx = await tokenB.approve(CONTRACTS.SimpleDEX, amountBWei);
      await approveBTx.wait();

      setStatus('Adding liquidity...');
      const addLiqTx = await dex.addLiquidity(amountAWei, amountBWei);
      await addLiqTx.wait();

      setStatus('✓ Liquidity added!');
      setAmountA('');
      setAmountB('');

      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error('Add liquidity error:', err);
      setStatus(`✗ Failed to add liquidity`);
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#161b22] dark:to-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-3xl p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-black dark:text-white mb-1">Add Liquidity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Earn 0.3% fees on all trades</p>
      </div>
      
      <div className="space-y-4">
        {/* Token A Input */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-900/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Token A Amount</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 shadow-md">
              <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-sm font-bold text-white">TKNA</span>
            </div>
          </div>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl font-bold outline-none w-full text-blue-900 dark:text-blue-100 placeholder-blue-300 dark:placeholder-blue-800"
            disabled={adding}
          />
        </div>

        {/* Plus Icon */}
        <div className="flex justify-center -my-2">
          <div className="bg-gray-100 dark:bg-[#21262d] rounded-xl p-2 border-4 border-gray-50 dark:border-[#0d1117]">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>

        {/* Token B Input */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-900/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Token B Amount</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 shadow-md">
              <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <span className="text-sm font-bold text-white">TKNB</span>
            </div>
          </div>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl font-bold outline-none w-full text-purple-900 dark:text-purple-100 placeholder-purple-300 dark:placeholder-purple-800"
            disabled={adding}
          />
        </div>
      </div>

      {/* Info Box */}
      {amountA && amountB && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950/10 dark:via-purple-950/10 dark:to-blue-950/10 rounded-xl border border-blue-200 dark:border-blue-900/30">
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">You're depositing</span>
              <span className="font-semibold text-black dark:text-white">{amountA} TKNA + {amountB} TKNB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Share of pool</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">~{((Number(amountA) / (Number(amountA) + 1000)) * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={handleAddLiquidity}
        disabled={!amountA || !amountB || adding || !signer}
        className="w-full mt-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-5 rounded-2xl disabled:from-gray-300 dark:disabled:from-gray-800 disabled:to-gray-300 dark:disabled:to-gray-800 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/40 hover:scale-[1.02]"
      >
        {adding ? (
          <>
            <Spinner size="md" />
            <span>{status}</span>
          </>
        ) : (
          status || 'Add Liquidity'
        )}
      </button>

      {/* Status */}
      {status && !adding && (
        <div className={`mt-4 p-4 rounded-xl text-sm text-center font-semibold flex items-center justify-center gap-2 ${
          status.includes('✓') 
            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30' 
            : status.includes('✗') 
            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30' 
            : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30'
        }`}>
          {status.includes('✓') && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {status.includes('✗') && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span>{status}</span>
        </div>
      )}
    </div>
  );
}
