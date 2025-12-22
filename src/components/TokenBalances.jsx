import { useState, useEffect, useRef, useCallback } from 'react';
import { Contract, formatEther } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';

/* =========================================================================
   COMPONENT: TOKEN BALANCES
   Displays user balances for Token A & B with auto-polling (limited duration).
   ========================================================================= */
export default function TokenBalances({ signer }) {

  // --- 1. STATE & REFS (GUDANG) ---
  const [balances, setBalances] = useState({ tokenA: '0', tokenB: '0' });
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(null);
  
  // Ref untuk nyimpen ID timer biar bisa dimatiin dari mana aja
  const pollTimerRef = useRef(null); 


  /* =======================================================================
     2. CORE LOGIC (MESIN UTAMA)
     ======================================================================= */
  
  // Fungsi fetch dipisah keluar biar 'useEffect' gak gendut
  // Pake useCallback biar memorinya stabil
  const fetchBalances = useCallback(async () => {
    if (!signer) return;

    try {
      const userAddress = await signer.getAddress();
      // Update address state cuma kalo emang berubah (biar gak re-render sampah)
      setAddress(prev => prev !== userAddress ? userAddress : prev);

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
    } catch (err) {
      console.error('Balance fetch failed:', err);
      // Optional: setBalances ke 0 kalau error, atau biarin nilai terakhir
    } finally {
      setLoading(false);
    }
  }, [signer]);

  // Helper kecil buat format angka biar JSX bersih
  const formatNumber = (val) => {
    return Number(val).toLocaleString(undefined, { 
      maximumFractionDigits: 2, 
      minimumFractionDigits: 2 
    });
  };


  /* =======================================================================
     3. EFFECTS (SENSOR & OTOMASI)
     ======================================================================= */

  // Effect: Lifecycle Management
  // Handle Load Awal, Polling 30 Detik, dan Reset saat Disconnect
  useEffect(() => {
    // A. Clean State kalau gak ada signer
    if (!signer) {
      setBalances({ tokenA: '0', tokenB: '0' });
      setLoading(false);
      setAddress(null);
      return;
    }

    // B. Load Pertama Langsung
    setLoading(true);
    fetchBalances();

    // C. Setup Polling (Maksimal 6x putaran / 30 detik)
    let pollCount = 0;
    
    // Clear timer lama kalau ada (safety guard)
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(() => {
      pollCount++;
      if (pollCount > 6) {
        clearInterval(pollTimerRef.current); // Stop setelah 30s
      } else {
        fetchBalances(); // Update background
      }
    }, 5000);

    // D. Cleanup (Matiin timer pas component hancur/signer ganti)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [signer, fetchBalances]);


  /* =======================================================================
     4. RENDER HELPERS (UI COMPONENTS)
     ======================================================================= */

  if (!signer) return null;

  if (loading && !address) { // Cuma show skeleton pas bener-bener load awal
    return (
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-5 mb-4 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-[#30363d] rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-200 dark:bg-[#30363d] rounded-xl"></div>
            <div className="h-24 bg-gray-200 dark:bg-[#30363d] rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================================
     5. MAIN RENDER (SHOWROOM)
     ======================================================================= */
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white dark:from-[#161b22] dark:to-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-2xl p-5 mb-4 shadow-sm">
      
      {/* Header Info */}
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
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Updates</span>
        </div>
      </div>
      
      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Token A */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/5 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">TKNA</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatNumber(balances.tokenA)}
          </p>
        </div>

        {/* Token B */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/5 border border-purple-200 dark:border-purple-900/30 rounded-xl p-4 hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">TKNB</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatNumber(balances.tokenB)}
          </p>
        </div>

      </div>
    </div>
  );
}