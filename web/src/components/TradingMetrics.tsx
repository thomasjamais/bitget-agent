'use client';

import React from 'react';
import { AggressiveTradingMetrics } from '@/types/bot';

interface TradingMetricsProps {
  metrics?: AggressiveTradingMetrics;
  uptime?: number;
}

export function TradingMetrics({ metrics, uptime }: TradingMetricsProps) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="trading-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        ⚡ Aggressive Trading Engine
      </h2>
      
      {metrics ? (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Daily Trades</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {metrics.dailyTrades}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                / {metrics.maxTradesPerSymbol} max per symbol
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Success Rate</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatPercentage(metrics.successRate)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {metrics.tradesExecuted} trades executed
              </div>
            </div>
          </div>
          
          {/* Trading Activity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Opportunities Found</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {metrics.opportunitiesFound}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Trades Executed</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {metrics.tradesExecuted}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio Balance</span>
              <span className={`font-semibold ${
                metrics.portfolioBalance > 0.8 ? 'trading-green' : 
                metrics.portfolioBalance > 0.5 ? 'text-yellow-600 dark:text-yellow-400' :
                'trading-red'
              }`}>
                {formatPercentage(metrics.portfolioBalance)}
              </span>
            </div>
          </div>
          
          {/* System Status */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">System Uptime</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {formatUptime(uptime || 0)}
              </span>
            </div>
          </div>
          
          {/* Performance Indicator */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Engine Status</span>
              <div className={`w-2 h-2 rounded-full ${
                metrics.successRate > 0.7 ? 'bg-green-400 animate-pulse' :
                metrics.successRate > 0.4 ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></div>
            </div>
            <div className={`text-sm font-medium ${
              metrics.successRate > 0.7 ? 'text-green-600 dark:text-green-400' :
              metrics.successRate > 0.4 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {metrics.successRate > 0.7 ? '🚀 Performing Excellently' :
               metrics.successRate > 0.4 ? '⚠️ Moderate Performance' :
               '🔴 Needs Attention'}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚡</div>
          <div className="text-gray-600 dark:text-gray-400">
            Waiting for trading metrics...
          </div>
        </div>
      )}
    </div>
  );
}