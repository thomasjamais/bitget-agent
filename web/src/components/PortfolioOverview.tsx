'use client';

import React from 'react';
import { Portfolio } from '@/types/bot';

interface PortfolioOverviewProps {
  portfolio?: Portfolio;
  equity?: number;
  dailyPnL?: number;
}

export function PortfolioOverview({ portfolio, equity, dailyPnL }: PortfolioOverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="trading-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          💰 Portfolio Overview
        </h2>
        {portfolio?.rebalanceNeeded && (
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm rounded-full">
            ⚖️ Rebalance Needed
          </span>
        )}
      </div>
      
      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Equity</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(equity || 0)}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio Value</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(portfolio?.totalValue || 0)}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Daily P&L</div>
          <div className={`text-2xl font-bold ${
            (dailyPnL || 0) >= 0 ? 'trading-green' : 'trading-red'
          }`}>
            {formatCurrency(dailyPnL || 0)}
          </div>
        </div>
      </div>
      
      {/* Allocation Grid */}
      {portfolio?.allocations && portfolio.allocations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Asset Allocations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {portfolio.allocations.map((allocation) => (
              <div key={allocation.symbol} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {allocation.symbol.replace('USDT', '')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    allocation.status === 'BALANCED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    allocation.status === 'OVERWEIGHT' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  }`}>
                    {allocation.status === 'BALANCED' ? '🟢' :
                     allocation.status === 'OVERWEIGHT' ? '🔴' : '🟡'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Current:</span>
                    <span className="font-mono">{formatPercentage(allocation.current * 100)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Target:</span>
                    <span className="font-mono">{formatPercentage(allocation.target * 100)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Deviation:</span>
                    <span className={`font-mono ${
                      Math.abs(allocation.deviation) < 0.05 ? 'text-green-600 dark:text-green-400' :
                      Math.abs(allocation.deviation) > 0.15 ? 'text-red-600 dark:text-red-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {formatPercentage(allocation.deviation * 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Value:</span>
                    <span className="font-mono">{formatCurrency(allocation.value || 0)}</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        allocation.status === 'BALANCED' ? 'bg-green-400' :
                        allocation.status === 'OVERWEIGHT' ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`}
                      style={{ width: `${Math.min(allocation.current * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* No Data State */}
      {(!portfolio || !portfolio.allocations || portfolio.allocations.length === 0) && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-600 dark:text-gray-400">
            Waiting for portfolio data...
          </div>
        </div>
      )}
    </div>
  );
}