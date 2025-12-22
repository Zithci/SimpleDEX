import { useEffect, useState, useCallback } from 'react';
import { Contract, parseEther, formatEther } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';
import Spinner from './Spinner';


export default function SwapInterface({ signer, onTxSuccess }) {
  
  // --- STATE MANAGEMENT ---
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('0');
  const [swapping, setSwapping] = useState(false);
  const [status, setStatus] = useState('');
  const [swapDirection, setSwapDirection] = useState(true); // true = TokenA -> TokenB
  const [userBalance, setUserBalance] = useState('0');

  /* =======================================================================
     CORE LOGIC & CALCULATIONS
     ======================================================================= */

  /**
   * Fetches the estimated output amount (Quote) from the DEX.
   * Wrapped in useCallback to prevent infinite loops in useEffect.
   */
  const calculateSwapOutput = useCallback(async () => {
    if (!amountIn || !signer) return;

    try {
      const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);
      const amountInWei = parseEther(amountIn);
      const tokenInAddress = swapDirection ? CONTRACTS.TokenA : CONTRACTS.TokenB;
      
      const output = await dex.getSwapOutput(tokenInAddress, amountInWei);
      setAmountOut(formatEther(output));

    } catch (err) {
      // Silent fail is okay here, usually means amount is 0 or invalid
      console.error('Calculate error:', err);
      setAmountOut('0');
    }
  }, [amountIn, signer, swapDirection]);


  /* =======================================================================
     SIDE EFFECTS (LISTENERS)
     ======================================================================= */

  // Effect: Sync User Balance
  // Triggers when wallet connects, swap direction changes, or after a successful TX.
  useEffect(() => {
    const fetchBalance = async () => {
      if (!signer) return;
      try {
        const tokenAddress = swapDirection ? CONTRACTS.TokenA : CONTRACTS.TokenB;
        const tokenContract = new Contract(tokenAddress, ABIS.TokenA, signer);
        const address = await signer.getAddress();

        const bal = await tokenContract.balanceOf(address);
        setUserBalance(formatEther(bal)); // Store as string for display
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };
    fetchBalance();
  }, [signer, swapDirection, onTxSuccess]);

  // Effect: Auto-Quote Debounce
  // Delays calculation by 500ms to prevent spamming RPC while typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amountIn) calculateSwapOutput();
    }, 500);
    return () => clearTimeout(timer);
  }, [amountIn, calculateSwapOutput]);


  /* =======================================================================
     EVENT HANDLERS (INTERACTIONS)
     ======================================================================= */

  const handlePercentage = (percent) => {
    if (!userBalance) return;
    let value ;
    if (percent === 100) {
      value = parseFloat(userBalance).toFixed(6);
    } else {
      const rawvalue  = (parseFloat(userBalance) * percent) /100;
      value =parseFloat(rawvalue.toFixed(6)).toString();

      value = parseFloat(value).toString();
    }
    setAmountIn(value);
    setTimeout(() => calculateSwapOutput(), 100);    
   
  };

  const handleSwap = async () => {
    if (!amountIn || !signer) return;

    setSwapping(true);
    setStatus('Checking pool...');

    try {
      const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);

      // 1. Validation: Prevent gas waste on empty pools
      const [reserveA, reserveB] = await dex.getReserves();
      if (reserveA.toString() === '0' || reserveB.toString() === '0') {
        throw new Error('Pool is empty');
      }

      const tokenInAddress = swapDirection ? CONTRACTS.TokenA : CONTRACTS.TokenB;
      const tokenIn = new Contract(tokenInAddress, ABIS.TokenA, signer);
      const amountInWei = parseEther(amountIn);

      // 2. Approve Token Spending
      setStatus('Approving...');
      const approveTx = await tokenIn.approve(CONTRACTS.SimpleDEX, amountInWei);
      await approveTx.wait(); // Critical: Wait for block confirmation

      // 3. Execute Swap
      setStatus('Swapping...');
      const swapTx = await dex.swap(tokenInAddress, amountInWei);
      await swapTx.wait(); // Critical: Wait for block confirmation

      // 4. Success Handling
      if (onTxSuccess) onTxSuccess(); // Trigger parent refresh
      
      setStatus('✓ Swap successful!');
      setAmountIn('');
      setAmountOut('0');
      setTimeout(() => setStatus(''), 3000);

    } catch (err) {
      console.error('Swap error:', err);

      // Sorting errors for better UX
      let errorMsg = '✗ Swap failed';
      if (err.message === 'Pool is empty' || err.message.includes('Insufficient output')) {
        errorMsg = '✗ Liquidity issue';
      } else if (err.message.includes('user rejected') || err.code === 'ACTION_REJECTED') {
        errorMsg = '✗ Transaction rejected';
      }

      setStatus(errorMsg);
      setTimeout(() => setStatus(''), 4000);
    } finally {
      setSwapping(false);
    }
  };

  const toggleDirection = () => {
    setSwapDirection(!swapDirection);
    setAmountIn('');
    setAmountOut('0');
  };

  /* =======================================================================
     RENDER HELPERS & UI
     ======================================================================= */
  
  // Dynamic Token Config
  const fromToken = swapDirection 
    ? { name: 'TKNA', color: 'blue', gradient: 'from-blue-500 to-blue-600', letter: 'A' } 
    : { name: 'TKNB', color: 'purple', gradient: 'from-purple-500 to-purple-600', letter: 'B' };
  
  const toToken = swapDirection 
    ? { name: 'TKNB', color: 'purple', gradient: 'from-purple-500 to-purple-600', letter: 'B' }
    : { name: 'TKNA', color: 'blue', gradient: 'from-blue-500 to-blue-600', letter: 'A' };

  const priceImpact = amountIn && amountOut !== '0' 
    ? ((1 - (Number(amountOut) / Number(amountIn))) * 100).toFixed(2)
    : '0';

    

    // guard logic(preventing nan display)
    const numericAccount  = parseFloat(amountIn || "0");
    const numericBalance =  parseFloat(userBalance || "0");
    const isInsufficient = numericAccount  > numericBalance;



return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#161b22] dark:to-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-3xl p-6 shadow-xl">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-black dark:text-white">Swap Tokens</h3>
        <button
          onClick={toggleDirection}
          disabled={swapping}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
        >
          Switch
        </button>
      </div>
      
      <div className="space-y-1">
        
        {/* --- INPUT: FROM TOKEN --- */}
        <div className={`bg-gray-50 dark:bg-[#0d1117] rounded-2xl p-5 border-2 transition-all hover:bg-gray-100 dark:hover:bg-[#010409] 
          ${isInsufficient 
            ? 'border-red-500/50 focus-within:border-red-500' 
            : 'border-transparent focus-within:border-blue-200 dark:focus-within:border-blue-900/50'
          }`}>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <span className={`text-xs font-bold uppercase tracking-wide shrink-0 ${isInsufficient ? 'text-red-500' : 'text-gray-500'}`}>
              {isInsufficient ? '⚠️ Insufficient Balance' : 'You Pay'}
            </span>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              {/* Percentage Buttons */}
              <div className="flex flex-wrap gap-1 bg-gray-100/50 dark:bg-gray-800/40 p-1 rounded-lg">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => handlePercentage(percent)}
                    disabled={swapping || !userBalance || userBalance === '0'}
                    className="px-2 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                  >
                    {percent === 100 ? 'MAX' : `${percent}%`}
                  </button>
                ))}
              </div>

              {/* Token Badge (FIXED: ICON ADA) */}
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-gradient-to-r ${fromToken.gradient} shadow-md shrink-0`}>
                <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                   <span className="text-white text-[10px] font-bold">{fromToken.letter}</span>
                </div>
                <span className="text-white text-[10px] font-bold">{fromToken.name}</span>
              </div>
            </div>
          </div>  

          {/* INPUT FIELD (FIXED: TRUNCATE & SIZE) */}
          <div className="min-w-0 w-full">
            <input
              type="number"
              value={amountIn}
              placeholder="0.0"
              disabled={swapping}
              min="0"
              step="any"
              onChange={(e) => {
                const val = e.target.value;
                if (parseFloat(val) > parseFloat(userBalance)) {
                  setAmountIn(userBalance);
                } else {
                  setAmountIn(val);
                }
              }}
              className={`bg-transparent text-2xl md:text-4xl font-bold outline-none w-full min-w-0 truncate 
                placeholder-gray-300 dark:placeholder-gray-600 
                ${isInsufficient ? 'text-red-500' : 'text-black dark:text-white'}`}
            />
          </div>
        </div>

        {/* --- ARROW DIVIDER --- */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={toggleDirection}
            disabled={swapping}
            className="bg-gradient-to-br from-gray-100 to-white dark:from-[#21262d] dark:to-[#161b22] border-4 border-gray-50 dark:border-[#0d1117] rounded-2xl p-3 hover:scale-110 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl group"
          >
            <svg 
              className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

{/* --- INPUT: TO TOKEN --- */}
        <div className="bg-gray-50 dark:bg-[#0d1117] rounded-2xl p-5 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-[#010409] transition-all overflow-hidden">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide shrink-0">You Receive</span>
          {/* Token Badge (FIX: Font size disamain jadi text-[10px]) */}
            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-gradient-to-r ${toToken.gradient} shadow-lg shrink-0`}>
              <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{toToken.letter}</span>
              </div>
              <span className="text-white text-[10px] font-bold">{toToken.name}</span>
            </div>         
            </div> 
          {/* RECEIVE INPUT (FIXED: JEBOL) */}
          <div className="flex items-center min-w-0 w-full">
            <input
              type="text"
              value={amountOut}
              readOnly
              className="bg-transparent text-2xl md:text-4xl font-bold outline-none w-full min-w-0 truncate text-black dark:text-white"
            />
          </div>
        </div>  
      </div>
      
      {/* --- INFO PANEL & ACTIONS --- */}
      {amountIn && amountOut !== '0' && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/10 dark:to-purple-950/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Rate</span>
            <span className="font-bold text-black dark:text-white">
              1 {fromToken.name} = {(Number(amountOut) / Number(amountIn)).toFixed(4)} {toToken.name}
            </span>
          </div>  
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-500">Price Impact</span>
            <span className={`font-semibold ${Number(priceImpact) > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {priceImpact}%
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={!amountIn || swapping || !signer || isInsufficient}
        className={`w-full mt-5 font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl 
          ${isInsufficient || !amountIn || !signer
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-700'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/20 hover:shadow-2xl hover:scale-[1.02]'
          }`}
      >
        {swapping ? (
          <>
            <Spinner size="md" />
            <span>{status}</span>
          </>
        ) : (
          isInsufficient ? `Insufficient ${fromToken.name} Balance` : (status || 'Swap Tokens')
        )}
      </button>

      {/* Status Indicators */}
      {status && !swapping && (
        <div className={`mt-4 p-4 rounded-xl text-sm text-center font-semibold flex items-center justify-center gap-2 ${
          status.includes('✓') 
            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30' 
            : status.includes('✗') 
            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30' 
            : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30'
        }`}>
          <span>{status}</span>
        </div>
      )}
    </div>
  );}