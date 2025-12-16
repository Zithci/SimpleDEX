import { useEffect, useState, useCallback } from 'react';
import { Contract, parseEther, formatEther } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';
import Spinner from './Spinner';

export default function SwapInterface({ signer, onTxSuccess }) {
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('0');
  const [swapping, setSwapping] = useState(false);
  const [status, setStatus] = useState('');
  const [swapDirection, setSwapDirection] = useState(true);
  const [userBalance, setUserBalance] = useState('0');

  // useEffect withdraw balance every time wallet change
  useEffect(() =>{
    const fetchBalance = async() => {
      if(!signer) return;
      try {
        const tokenAddress = swapDirection ? CONTRACTS.TokenA : CONTRACTS.TokenB;
        const tokenContract = new Contract(tokenAddress, ABIS.TokenA , signer);
        const address = await signer.getAddress(); //get contract signer adderss

        const bal = await tokenContract.balanceOf(address);
      //save in ether format(string),misal "100.0"  
      setUserBalance(formatEther(bal));
      }catch(err){
        console.error("failed to withdraw", err);
      }
    };
    fetchBalance();
  }, [signer, swapDirection,onTxSuccess]) //update if swap direct changed/ newest tx

const calculateSwapOutput = useCallback(async () => {
  if (!amountIn || !signer) return;

  try {
    const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);
    const amountInWei = parseEther(amountIn);
    
    const tokenInAddress = swapDirection ? CONTRACTS.TokenA : CONTRACTS.TokenB;
    const output = await dex.getSwapOutput(tokenInAddress, amountInWei);
    setAmountOut(formatEther(output));

  } catch (err) {
    console.error('Calculate error:', err);
    setAmountOut('0');
  }
}, [amountIn, signer, swapDirection]); // <-- INI PENTING
  
  // percent button 
  const handlePercentage = (percent) => {
    console.log("did the button show any sign?")
    if(!userBalance) return;

    if(percent === 100){
      setAmountIn(userBalance)
    }else{
      const value =  (parseFloat(userBalance)* percent) / 100;
      setAmountIn(value.toFixed(4)) // fixed decimal 4 digits   
    }
    setTimeout(() =>calculateSwapOutput(),100);
  };  



//automated triggger
    useEffect(() =>{
      const timer = setTimeout(() => {
        if(amountIn) calculateSwapOutput();
      }, 500);
      return() =>clearTimeout(timer);
      },[amountIn, calculateSwapOutput]);
    


  const handleSwap = async () => {
    if (!amountIn || !signer) return;

    setSwapping(true);
    setStatus('Checking pool...');

    try {
      const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, signer);
      
      //  check reserves
      const [reserveA, reserveB] = await dex.getReserves();
      if (reserveA.toString() === '0' || reserveB.toString() === '0') {
        setStatus('✗ Pool empty - add liquidity first');
        setSwapping(false);
        setTimeout(() => setStatus(''), 4000);
        return;
      }

      const tokenInAddress = swapDirection ? CONTRACTS.TokenA : CONTRACTS.TokenB;
      const tokenIn = new Contract(tokenInAddress, ABIS.TokenA, signer);
      
      const amountInWei = parseEther(amountIn);

      setStatus('Approving...');
      const approveTx = await tokenIn.approve(CONTRACTS.SimpleDEX, amountInWei);
      await approveTx.wait();

      setStatus('Swapping...');
      const swapTx = await dex.swap(tokenInAddress, amountInWei);
      await swapTx.wait();

      // trigger parents update
      if(onTxSuccess) {
        console.log("swap succeed, triggering parent.")
        onTxSuccess();
      }
      setStatus('✓ Swap successful!');
      setAmountIn('');
      setAmountOut('0');

      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error('Swap error:', err);
      
      let errorMsg = '✗ Swap failed';
      if (err.message.includes('Insufficient output')) {
        errorMsg = '✗ Amount too small or pool empty';
      } else if (err.message.includes('user rejected')) {
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

  const fromToken = swapDirection 
    ? { name: 'TKNA', color: 'blue', gradient: 'from-blue-500 to-blue-600', letter: 'A' } 
    : { name: 'TKNB', color: 'purple', gradient: 'from-purple-500 to-purple-600', letter: 'B' };
  
  const toToken = swapDirection 
    ? { name: 'TKNB', color: 'purple', gradient: 'from-purple-500 to-purple-600', letter: 'B' }
    : { name: 'TKNA', color: 'blue', gradient: 'from-blue-500 to-blue-600', letter: 'A' };

  const priceImpact = amountIn && amountOut !== '0' 
    ? ((1 - (Number(amountOut) / Number(amountIn))) * 100).toFixed(2)
    : '0';

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#161b22] dark:to-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-3xl p-6 shadow-xl">
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
        {/* From */}
        <div className="bg-gray-50 dark:bg-[#0d1117] rounded-2xl p-5 border-2 border-transparent focus-within:border-blue-200 dark:focus-within:border-blue-900/50 transition-all hover:bg-gray-100 dark:hover:bg-[#010409]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">You Pay</span>
            <div className="flex justify-end gap-2 mb-2">
      {[25, 50, 75, 100].map((percent) => (
        <button
          key={percent}
          onClick={() => handlePercentage(percent)}
          disabled={swapping || !userBalance || userBalance === '0'}
          className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          {percent === 100 ? 'Max' : `${percent}%`}
        </button>
      ))}
   </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${fromToken.gradient} shadow-lg`}>
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">{fromToken.letter}</span>
              </div>
              <span className="text-sm font-bold text-white">{fromToken.name}</span>
            </div>
          </div>
          <input
            type="number"
            value={amountIn}
            onChange={(e) => {
              setAmountIn(e.target.value);

            }}
            placeholder="0.0"
            className="bg-transparent text-4xl font-bold outline-none w-full text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
            disabled={swapping}
          />
        </div>

        {/* Arrow Button */}
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

        {/* To */}
        <div className="bg-gray-50 dark:bg-[#0d1117] rounded-2xl p-5 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-[#010409] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">You Receive</span>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${toToken.gradient} shadow-lg`}>
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">{toToken.letter}</span>
              </div>
              <span className="text-sm font-bold text-white">{toToken.name}</span>
            </div>
          </div>
          <input
            type="text"
            value={amountOut}
            readOnly
            className="bg-transparent text-4xl font-bold outline-none w-full text-black dark:text-white"
          />
        </div>
      </div>

      {/* Rate Info */}
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

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!amountIn || swapping || !signer}
        className="w-full mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg py-5 rounded-2xl disabled:from-gray-300 dark:disabled:from-gray-800 disabled:to-gray-300 dark:disabled:to-gray-800 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.02]"
      >
        {swapping ? (
          <>
            <Spinner size="md" />
            <span>{status}</span>
          </>
        ) : (
          status || 'Swap Tokens'
        )}
      </button>

      {/* Status */}
      {status && !swapping && (
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
