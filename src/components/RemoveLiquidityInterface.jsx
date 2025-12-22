import { useState, useEffect } from 'react';
import { Contract, formatEther, parseEther } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';
import Spinner from './Spinner';

export default function RemoveLiquidityInterface({ signer, onTxSuccess }) {
  const [lpAmount, setLpAmount] = useState('');
  const [lpBalance, setLpBalance] = useState('0');
  const [removing, setRemoving] = useState(false);
  const [status, setStatus] = useState('');
  const [expectedA, setExpectedA] = useState('0');
  const [expectedB, setExpectedB] = useState('0');

  // Fetch LP balance
  useEffect(() => {
    const fetchLPBalance = async () => {
      if (!signer) return;
      try {
        const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);
        const address = await signer.getAddress();
        const balance = await dex.balanceOf(address);
        setLpBalance(formatEther(balance));
      } catch (err) {
        console.error('Failed to fetch LP balance:', err);
      }
    };
    fetchLPBalance();
  }, [signer, onTxSuccess]);

  // Calculate expected outputs
  useEffect(() => {
    const calculateOutput = async () => {
      if (!lpAmount || !signer || lpAmount === '0') {
        setExpectedA('0');
        setExpectedB('0');
        return;
      }

      try {
        const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);
        const [reserveA, reserveB] = await dex.getReserves();
        const totalSupply = await dex.totalSupply();

        const lpAmountWei = parseEther(lpAmount);
        const amountA = (lpAmountWei * reserveA) / totalSupply;
        const amountB = (lpAmountWei * reserveB) / totalSupply;

        setExpectedA(formatEther(amountA));
        setExpectedB(formatEther(amountB));
      } catch (err) {
        console.error('Calculate error:', err);
        setExpectedA('0');
        setExpectedB('0');
      }
    };

    const timer = setTimeout(calculateOutput, 300);
    return () => clearTimeout(timer);
  }, [lpAmount, signer]);

  const handlePercentage = (percent) => {
    if (!lpBalance || lpBalance === '0') return;
    
    if (percent === 100) {
      setLpAmount(lpBalance);
    } else {
      const value = (parseFloat(lpBalance) * percent) / 100;
      setLpAmount(value.toFixed(4));
    }
  };

  const handleRemove = async () => {
    if (!lpAmount || !signer) return;

    setRemoving(true);
    setStatus('Removing liquidity...');

    try {
      const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);
      const lpAmountWei = parseEther(lpAmount);

      const removeTx = await dex.removeLiquidity(lpAmountWei);
      await removeTx.wait();

      if (onTxSuccess) {
        onTxSuccess();
      }

      setStatus('✓ Liquidity removed!');
      setLpAmount('');
      setExpectedA('0');
      setExpectedB('0');

      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error('Remove liquidity error:', err);
      
      let errorMsg = '✗ Failed to remove liquidity';
      if (err.message.includes('user rejected')) {
        errorMsg = '✗ Transaction rejected';
      }
      
      setStatus(errorMsg);
      setTimeout(() => setStatus(''), 4000);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#161b22] dark:to-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-3xl p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-black dark:text-white mb-1">Remove Liquidity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          LP Balance: <span className="font-semibold text-black dark:text-white">{parseFloat(lpBalance).toFixed(4)}</span>
        </p>
      </div>

      {/* LP Amount Input */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/10 rounded-2xl p-5 border-2 border-red-200 dark:border-red-900/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">LP Tokens to Burn</span>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => handlePercentage(percent)}
                disabled={removing || !lpBalance || lpBalance === '0'}
                className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                {percent === 100 ? 'Max' : `${percent}%`}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          value={lpAmount}
          onChange={(e) => setLpAmount(e.target.value)}
          placeholder="0.0"
          className="bg-transparent text-3xl font-bold outline-none w-full text-red-900 dark:text-red-100 placeholder-red-300 dark:placeholder-red-800"
          disabled={removing}
        />
      </div>

      {/* Arrow */}
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 dark:bg-[#21262d] rounded-xl p-2">
          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Expected Outputs */}
      <div className="space-y-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">TKNA</span>
            </div>
            <span className="text-xl font-bold text-blue-900 dark:text-blue-100">{parseFloat(expectedA).toFixed(4)}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl p-4 border border-purple-200 dark:border-purple-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">TKNB</span>
            </div>
            <span className="text-xl font-bold text-purple-900 dark:text-purple-100">{parseFloat(expectedB).toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        disabled={!lpAmount || removing || !signer || lpAmount === '0'}
        className="w-full mt-5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-lg py-5 rounded-2xl disabled:from-gray-300 dark:disabled:from-gray-800 disabled:to-gray-300 dark:disabled:to-gray-800 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/40 hover:scale-[1.02]"
      >
        {removing ? (
          <>
            <Spinner size="md" />
            <span>{status}</span>
          </>
        ) : (
          status || 'Remove Liquidity'
        )}
      </button>

      {/* Status */}
      {status && !removing && (
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