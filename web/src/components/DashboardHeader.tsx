'use client';

import React from 'react';

interface DashboardHeaderProps {
  isConnected: boolean;
  lastUpdate?: number;
  error?: string | null;
}

export function DashboardHeader({ isConnected, lastUpdate, error }: DashboardHeaderProps) {
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '--:--:--';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTimeSinceUpdate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="trading-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🚀 Bitget Trading Bot Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Real-time monitoring with aggressive trading & portfolio balancing
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isConnected ? '✅ Connected' : '🔌 Disconnected'}
            </span>
          </div>
          
          {/* Last Update */}
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Last Update
            </div>
            <div className="text-sm font-mono">
              {formatTime(lastUpdate)}
            </div>
            <div className="text-xs text-gray-500">
              {getTimeSinceUpdate(lastUpdate)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm text-red-700 dark:text-red-300">
              Connection Error: {error}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}