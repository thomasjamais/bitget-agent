"use client";

import React from "react";
import { Wifi, WifiOff, Clock, AlertTriangle } from "lucide-react";

interface DashboardHeaderProps {
  isConnected: boolean;
  lastUpdate?: number;
  error?: string | null;
}

export function DashboardHeader({
  isConnected,
  lastUpdate,
  error,
}: DashboardHeaderProps) {
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "--:--:--";
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTimeSinceUpdate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="trading-card p-8 fade-in hover-lift">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg pulse-glow">
              <span className="text-white text-2xl font-bold">🚀</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-primary bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bitget Trading Bot
              </h1>
              <p className="text-secondary text-xl font-medium">
                Professional Trading Dashboard
              </p>
            </div>
          </div>
          <p className="text-muted text-lg max-w-3xl leading-relaxed">
            Advanced algorithmic trading with real-time portfolio management,
            automated rebalancing, and AI-powered market analysis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover-glow">
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <WifiOff className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <div
                className={`text-sm font-semibold ${
                  isConnected
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isConnected ? "Live Data" : "Offline"}
              </div>
              <div className="text-xs text-muted">
                {isConnected ? "Real-time streaming" : "Connection lost"}
              </div>
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm hover-glow">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-primary">
                {formatTime(lastUpdate)}
              </div>
              <div className="text-xs text-muted">
                {getTimeSinceUpdate(lastUpdate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-red-700 dark:text-red-300">
                Connection Error
              </div>
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
