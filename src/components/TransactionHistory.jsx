import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import { CONTRACTS } from '../contracts/addresses';
import { ABIS } from '../contracts/abis';
import React from 'react';

export default function TransactionHistory(props) {
  const provider = props.provider;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provider) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const dex = new Contract(CONTRACTS.SimpleDEX, ABIS.SimpleDEX, provider);
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000);

        const allEvents = [];
        
        try {
          const swapEvents = await dex.queryFilter('Swap', fromBlock, currentBlock);
          for (let i = 0; i < swapEvents.length; i++) {
            const e = swapEvents[i];
            allEvents.push({ 
              type: 'Swap', 
              blockNumber: e.blockNumber, 
              hash: e.transactionHash 
            });
          }
        } catch (e) {
          console.log('No swap events');
        }

        try {
          const addEvents = await dex.queryFilter('LiquidityAdded', fromBlock, currentBlock);
          for (let i = 0; i < addEvents.length; i++) {
            const e = addEvents[i];
            allEvents.push({ 
              type: 'Add', 
              blockNumber: e.blockNumber, 
              hash: e.transactionHash 
            });
          }
        } catch (e) {
          console.log('No add events');
        }

        try {
          const removeEvents = await dex.queryFilter('LiquidityRemoved', fromBlock, currentBlock);
          for (let i = 0; i < removeEvents.length; i++) {
            const e = removeEvents[i];
            allEvents.push({ 
              type: 'Remove', 
              blockNumber: e.blockNumber, 
              hash: e.transactionHash 
            });
          }
        } catch (e) {
          console.log('No remove events');
        }

        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
        setTransactions(allEvents.slice(0, 10));
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    };

    loadHistory();
  }, [provider]);

  if (!provider) {
    return null;
  }

  if (loading) {
    return React.createElement('div', {
      className: 'bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-6'
    },
      React.createElement('h3', {
        className: 'text-base font-bold text-black dark:text-white mb-4'
      }, 'Recent Transactions'),
      React.createElement('div', {
        className: 'space-y-3 animate-pulse'
      },
        React.createElement('div', { className: 'h-16 bg-gray-200 dark:bg-[#30363d] rounded-xl' }),
        React.createElement('div', { className: 'h-16 bg-gray-200 dark:bg-[#30363d] rounded-xl' })
      )
    );
  }

  if (transactions.length === 0) {
    return React.createElement('div', {
      className: 'bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-12 text-center'
    },
      React.createElement('p', {
        className: 'text-sm font-semibold text-black dark:text-white'
      }, 'No transactions yet')
    );
  }

  const txElements = [];
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    
    let bgColor = 'bg-blue-100 dark:bg-blue-950/20';
    let emoji = '🔄';
    
    if (tx.type === 'Add') {
      bgColor = 'bg-green-100 dark:bg-green-950/20';
      emoji = '➕';
    } else if (tx.type === 'Remove') {
      bgColor = 'bg-red-100 dark:bg-red-950/20';
      emoji = '➖';
    }

    const url = 'https://sepolia.etherscan.io/tx/' + tx.hash;
    const iconClass = 'w-10 h-10 rounded-lg flex items-center justify-center ' + bgColor;

    txElements.push(
      React.createElement('a', {
        key: i,
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-[#161b22] rounded-xl transition-all'
      },
        React.createElement('div', {
          className: 'flex items-center gap-3'
        },
          React.createElement('div', {
            className: iconClass
          },
            React.createElement('span', {
              className: 'text-xl'
            }, emoji)
          ),
          React.createElement('div', null,
            React.createElement('p', {
              className: 'text-sm font-semibold text-black dark:text-white'
            }, tx.type),
            React.createElement('p', {
              className: 'text-xs text-gray-500 dark:text-gray-400'
            }, 'Block #' + tx.blockNumber)
          )
        )
      )
    );
  }

  return React.createElement('div', {
    className: 'bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl p-6'
  },
    React.createElement('h3', {
      className: 'text-base font-bold text-black dark:text-white mb-4'
    }, 'Recent Transactions'),
    React.createElement('div', {
      className: 'space-y-2'
    }, ...txElements)
  );
}