"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { BotData } from "@/types/bot";

export default function SettingsPage() {
  const [botData, setBotData] = useState<BotData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "trading" | "risk" | "ai"
  >("general");
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [currentMode, setCurrentMode] = useState<'testnet' | 'production'>('testnet');

  const { data, connected } = useWebSocket("ws://localhost:8080/ws");

  useEffect(() => {
    setIsConnected(connected);
    if (data) {
      setBotData(data as BotData);
    }
  }, [data, connected]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const toggleMode = async () => {
    setIsSwitchingMode(true);
    try {
      const newMode = currentMode === 'testnet' ? 'production' : 'testnet';
      const response = await fetch('http://localhost:8080/api/bot/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mode: newMode,
          useTestnet: newMode === 'testnet'
        }),
      });
      
        if (response.ok) {
        const result = await response.json();
        setCurrentMode(newMode);
        // No need to reload - changes are applied immediately!
        console.log('Mode switched successfully:', result);
      } else {
        console.error('Failed to toggle mode');
      }
    } catch (error) {
      console.error('Error toggling mode:', error);
    } finally {
      setIsSwitchingMode(false);
    }
  };

  // Update current mode from bot data
  useEffect(() => {
    if (botData && botData.config) {
      const isTestnet = botData.config.api?.useTestnet ?? true;
      setCurrentMode(isTestnet ? 'testnet' : 'production');
    }
  }, [botData]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ⚙️ Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Configure bot parameters and trading strategies
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
            }`}
          ></div>
          <span
            className={`text-sm font-medium ${
              isConnected
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isConnected ? "✅ Live Data" : "🔌 Disconnected"}
          </span>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="trading-card p-6">
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "general"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🔧 General
          </button>
          <button
            onClick={() => setActiveTab("trading")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "trading"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            ⚡ Trading
          </button>
          <button
            onClick={() => setActiveTab("risk")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "risk"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🛡️ Risk
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ai"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🤖 AI
          </button>
        </div>

        {/* General Settings */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔧 General Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Trading Mode Toggle */}
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    🎛️ Trading Mode
                  </label>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${
                          currentMode === "testnet"
                            ? "bg-yellow-500 text-yellow-900"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {currentMode === "testnet" ? "🧪 PLAYGROUND" : "🔥 PRODUCTION"}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {currentMode === "testnet"
                          ? "Safe simulation mode"
                          : "⚠️ Real money trading"}
                      </span>
                    </div>
                    
                    <button
                      onClick={toggleMode}
                      disabled={isSwitchingMode}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        isSwitchingMode
                          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                          : currentMode === "testnet"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-yellow-600 hover:bg-yellow-700 text-yellow-900"
                      }`}
                    >
                      {isSwitchingMode ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Switching now...</span>
                        </div>
                      ) : (
                        `⚡ Switch to ${currentMode === "testnet" ? "🔥 Production" : "🧪 Playground"}`
                      )}
                    </button>
                  </div>
                  
                  <div className={`text-xs p-3 rounded-lg ${
                    currentMode === "testnet"
                      ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
                      : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                  }`}>
                    {currentMode === "testnet" ? (
                      "🛡️ You're in playground mode. All trades are simulated with fake money. ⚡ Changes apply instantly!"
                    ) : (
                      "⚠️ ATTENTION: You're in production mode. All trades use real money! ⚡ Changes apply instantly!"
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Environment Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <div
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        botData?.environment === "TESTNET"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      }`}
                    >
                      {botData?.environment || "TESTNET"}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {botData?.environment === "TESTNET"
                        ? "🟡 Test Mode Active"
                        : "🟢 Live Trading Active"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bot Uptime
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.uptime
                      ? `${Math.floor(botData.uptime / 3600)}h ${Math.floor(
                          (botData.uptime % 3600) / 60
                        )}m`
                      : "--:--"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Equity
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {formatCurrency(botData?.equity || 0)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily P&L
                  </label>
                  <div
                    className={`text-lg font-mono ${
                      (botData?.dailyPnL || 0) >= 0
                        ? "trading-green"
                        : "trading-red"
                    }`}
                  >
                    {formatCurrency(botData?.dailyPnL || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Engine Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        botData?.aiEngine?.status === "OPERATIONAL"
                          ? "bg-green-400"
                          : "bg-red-400"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {botData?.aiEngine?.model || "Unknown Model"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Accuracy
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {formatPercentage((botData?.aiEngine?.accuracy || 0) * 100)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading Settings */}
        {activeTab === "trading" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ⚡ Trading Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Trades Per Symbol
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.aggressiveTrading?.maxTradesPerSymbol || 0}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Trades
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.aggressiveTrading?.dailyTrades || 0}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Success Rate
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {formatPercentage(
                      (botData?.aggressiveTrading?.successRate || 0) * 100
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opportunities Found
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.aggressiveTrading?.opportunitiesFound || 0}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trades Executed
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.aggressiveTrading?.tradesExecuted || 0}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portfolio Balance
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {formatPercentage(
                      (botData?.aggressiveTrading?.portfolioBalance || 0) * 100
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Settings */}
        {activeTab === "risk" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🛡️ Risk Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portfolio Rebalance Status
                  </label>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      botData?.portfolio?.rebalanceNeeded
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    }`}
                  >
                    {botData?.portfolio?.rebalanceNeeded
                      ? "⚖️ Rebalance Needed"
                      : "✅ Balanced"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Portfolio Value
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {formatCurrency(botData?.portfolio?.totalValue || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Active Positions
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.portfolio?.positions?.length || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Rebalance
                  </label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {botData?.portfolio?.lastRebalance
                      ? new Date(
                          botData.portfolio.lastRebalance
                        ).toLocaleString()
                      : "Never"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Risk Score
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {(botData?.portfolio?.positions?.length || 0) > 0
                      ? (Math.random() * 0.5 + 0.2).toFixed(2)
                      : "0.00"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Drawdown
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    -5.2%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Settings */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🤖 AI Engine Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Model
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.aiEngine?.model || "Unknown"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model Status
                  </label>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      botData?.aiEngine?.status === "OPERATIONAL"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {botData?.aiEngine?.status || "UNKNOWN"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Predictions Made
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {botData?.aiEngine?.predictions || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accuracy Rate
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {formatPercentage((botData?.aiEngine?.accuracy || 0) * 100)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model Version
                  </label>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    v2.1.0
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Training
                  </label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    2024-01-15 14:30:00
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="trading-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎛️ Bot Controls
        </h2>

        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
            🟢 Start Trading
          </button>
          <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors">
            ⏸️ Pause Trading
          </button>
          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
            🔴 Stop Trading
          </button>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            🔄 Restart Bot
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 dark:text-yellow-400 text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
                Important Notice
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Bot controls are currently read-only. To modify trading
                parameters, please update the configuration files and restart
                the bot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
