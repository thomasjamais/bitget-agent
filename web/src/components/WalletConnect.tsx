"use client";

import { useState } from 'react'

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  const connectWallet = () => {
    // Simulate wallet connection
    setIsConnected(true)
    setAddress('0x1234...5678')
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress(null)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        <span className="text-lg">🔗</span>
        <span className="text-sm font-medium">Connect Wallet</span>
      </button>
    )
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-white">
          {formatAddress(address!)}
        </span>
      </div>
      
      <div className="text-right">
        <div className="text-xs text-gray-400">Balance</div>
        <div className="text-sm font-medium text-white">
          0.00 ETH
        </div>
      </div>
      
      <button
        onClick={disconnectWallet}
        className="text-gray-400 hover:text-white transition-colors"
        title="Disconnect"
      >
        <span className="text-sm">✕</span>
      </button>
    </div>
  )
}