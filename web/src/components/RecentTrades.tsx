'use client';

import React from 'react';
import { Trade } from '@/types/bot';

interface RecentTradesProps {
  trades?: Trade[];
  className?: string;
}

export function RecentTrades({ trades, className = '' }: RecentTradesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled': return '✅';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`trading-card p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        📈 Recent Trades
      </h2>
      
      {trades && trades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Symbol</th>
                <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Side</th>
                <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Price</th>
                <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">P&L</th>
                <th className="text-center py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 10).map((trade) => (
                <tr key={trade.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {trade.symbol.replace('USDT', '')}
                    </span>
                  </td>
                  
                  <td className="py-3 px-2">
                    <span className={`font-medium ${getSideColor(trade.side)}`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="py-3 px-2 text-right">
                    <span className="font-mono text-gray-900 dark:text-white">
                      {trade.amount.toFixed(4)}
                    </span>
                  </td>
                  
                  <td className="py-3 px-2 text-right">
                    <span className="font-mono text-gray-900 dark:text-white">
                      {formatCurrency(trade.price)}
                    </span>
                  </td>
                  
                  <td className="py-3 px-2 text-right">
                    {trade.pnl !== undefined ? (
                      <span className={`font-mono font-semibold ${
                        trade.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                      <span className="mr-1">{getStatusIcon(trade.status)}</span>
                      {trade.status.toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="py-3 px-2 text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {trades.length > 10 && (
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing 10 of {trades.length} trades
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📈</div>
          <div className="text-gray-600 dark:text-gray-400 mb-2">
            No recent trades
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Trades will appear here when the bot starts trading
          </div>
        </div>
      )}
    </div>
  );
}