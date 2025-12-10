# SimpleDEX - Automated Market Maker

A production-grade decentralized exchange implementing Uniswap V2's constant product formula (x * y = k). Built with security-first principles including reentrancy guards and comprehensive error handling.

## Key Features
- **AMM Protocol**: Constant product market maker with 0.3% swap fees
- **Liquidity Provision**: Add/remove liquidity with automatic LP token minting
- **Multi-Wallet Support**: MetaMask, Coinbase Wallet, and WalletConnect integration
- **Transaction History**: Real-time event tracking with Etherscan links
- **Security Hardened**: OpenZeppelin ReentrancyGuard on all state-changing functions
- **Premium UI/UX**: Dark mode, responsive design, real-time balance updates

## Smart Contracts (Sepolia Testnet)
- TokenA: `0x7eff7315e03fe9567a0F1292ADE6fF8249EF7d51`
- TokenB: `0x5edabF729845A751203469d139D9ea53203cC9a6`
- SimpleDEX: `0xFAd733013d642606aB2fB203321dD9706D97a22c`

## Tech Stack
**Backend:** Solidity ^0.8.24, Hardhat, OpenZeppelin Contracts  
**Frontend:** React 19, Vite, ethers.js v6, TailwindCSS  
**Network:** Ethereum Sepolia Testnet

## Architecture Highlights
- Square root algorithm for initial liquidity calculation
- Price impact warnings for large swaps
- Slippage protection mechanisms
- Event-driven transaction history
- Optimized gas usage patterns

Built as a learning project to understand DeFi primitives and AMM mechanics.