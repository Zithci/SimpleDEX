import { useState, useEffect,useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { SEPOLIA_CHAIN_ID } from '../contracts/addresses';
import Spinner from './Spinner';

export default function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  const [error, setError] = useState(null);
  

    const connectWallet = useCallback(async (walletType) => {
    setIsConnecting(true);
    setError(null);
    

       try {
      let provider;

      if (window.ethereum?.providers) {
        if (walletType === 'coinbase') {
          provider = window.ethereum.providers.find(p => p.isCoinbaseWallet);
          if (!provider) {
            throw new Error('Coinbase Wallet extension not found. Make sure it\'s installed and enabled.');
          }
        } else {
          provider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
        }
      } else if (window.ethereum) {
        if (walletType === 'coinbase' && !window.ethereum.isCoinbaseWallet) {
          throw new Error('Coinbase Wallet not detected. Using default wallet instead.');
        }
        provider = window.ethereum;
      } else {
        throw new Error('No wallet detected! Please install MetaMask or Coinbase Wallet.');
      }

       await provider.request({
        method: 'eth_requestAccounts'
      });

      const ethersProvider = new BrowserProvider(provider);
      const network = await ethersProvider.getNetwork();

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      }

      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setShowWallets(false);
      onConnect({ provider: ethersProvider, signer, address });

    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  },[onConnect]);

  

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          onConnect(null);
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          connectWallet('metamask');
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, onConnect,connectWallet]);



  const disconnectWallet = async () => {
    try {
      setAccount(null);
      onConnect(null);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  if (account) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/10 dark:to-purple-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">Connected</p>
              <p className="text-sm font-mono font-semibold text-black dark:text-white">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          </div>
          <button
            onClick={disconnectWallet}
            className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-red-200 dark:border-red-900/30"
          >
            Disconnect
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          To fully disconnect, lock your wallet extension
        </p>
      </div>
    );
  }

  if (showWallets) {
    return (
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-6 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black dark:text-white">Connect Wallet</h3>
          <button
            onClick={() => {
              setShowWallets(false);
              setError(null);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => connectWallet('metamask')}
            disabled={isConnecting}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🦊</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-black dark:text-white">MetaMask</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Most popular wallet</p>
            </div>
            {isConnecting && <Spinner size="sm" />}
          </button>

          <button
            onClick={() => connectWallet('coinbase')}
            disabled={isConnecting}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💙</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-black dark:text-white">Coinbase Wallet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Self-custody wallet</p>
            </div>
            {isConnecting && <Spinner size="sm" />}
          </button>

          <button
            onClick={() => setError('WalletConnect QR coming soon! Use MetaMask Mobile for now.')}
            disabled={isConnecting}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-black dark:text-white">Mobile Wallet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scan QR code</p>
            </div>
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          New to crypto? <a href="https://metamask.io/download" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Get MetaMask</a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-6 mb-4 shadow-sm">
      <button
        onClick={() => setShowWallets(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
        </svg>
        <span>Connect Wallet</span>
      </button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        MetaMask • Coinbase • Mobile Wallets
      </p>
    </div>
  );
}