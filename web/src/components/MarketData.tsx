'use client';

import React from 'react';
import { MarketData as MarketDataType } from '@/types/bot';

interface MarketDataProps {
  marketData?: MarketDataType[];
}

export function MarketData({ marketData }: MarketDataProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div className="trading-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        📊 Market Data
      </h2>
      
      {marketData && marketData.length > 0 ? (
        <div className="space-y-3">
          {marketData.map((item) => (
            <div key={item.symbol} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.symbol.replace('USDT', '')}
                  </span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    item.change24h >= 0 ? 
                    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {formatPercentage(item.change24h)}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(item.price)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">24h High</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(item.high24h)}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600 dark:text-gray-400">24h Low</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(item.low24h)}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Volume</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatVolume(item.volume24h)}
                  </div>
                </div>
              </div>
              
              {/* Price indicator bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${
                      item.change24h >= 0 ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs(item.change24h) * 10, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Last update: {new Date(item.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-600 dark:text-gray-400">
            Waiting for market data...
          </div>
        </div>
      )}
    </div>
  );
}