"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { BotData } from "@/types/bot";

export default function PortfolioPage() {
  const [botData, setBotData] = useState<BotData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            💰 Portfolio Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Advanced portfolio analysis and rebalancing
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

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Portfolio Value
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(botData?.portfolio?.totalValue || 0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {botData?.portfolio?.rebalanceNeeded
              ? "⚖️ Rebalance Needed"
              : "✅ Balanced"}
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Available Balance
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(botData?.equity || 0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            USDT Available
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Daily P&L
          </div>
          <div
            className={`text-3xl font-bold ${
              (botData?.dailyPnL || 0) >= 0 ? "trading-green" : "trading-red"
            }`}
          >
            {formatCurrency(botData?.dailyPnL || 0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatPercentage(
              ((botData?.dailyPnL || 0) / (botData?.equity || 1)) * 100
            )}
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Positions
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {botData?.portfolio?.positions?.length || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Open Positions
          </div>
        </div>
      </div>

      {/* Portfolio Allocations */}
      {botData?.portfolio?.allocations &&
        botData.portfolio.allocations.length > 0 && (
          <div className="trading-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              📊 Asset Allocations
            </h2>

            <div className="space-y-4">
              {botData.portfolio.allocations.map((allocation) => (
                <div
                  key={allocation.symbol}
                  className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {allocation.symbol.replace("USDT", "")}
                      </span>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          allocation.status === "BALANCED"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : allocation.status === "OVERWEIGHT"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        }`}
                      >
                        {allocation.status === "BALANCED"
                          ? "🟢 Balanced"
                          : allocation.status === "OVERWEIGHT"
                          ? "🔴 Overweight"
                          : "🟡 Underweight"}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(allocation.value || 0)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Current Value
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Current
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatPercentage(allocation.current * 100)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Target
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatPercentage(allocation.target * 100)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Deviation
                      </div>
                      <div
                        className={`font-semibold ${
                          Math.abs(allocation.deviation) < 0.05
                            ? "text-green-600 dark:text-green-400"
                            : Math.abs(allocation.deviation) > 0.15
                            ? "text-red-600 dark:text-red-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {formatPercentage(allocation.deviation * 100)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        allocation.status === "BALANCED"
                          ? "bg-green-400"
                          : allocation.status === "OVERWEIGHT"
                          ? "bg-red-400"
                          : "bg-yellow-400"
                      }`}
                      style={{
                        width: `${Math.min(allocation.current * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Current Positions */}
      {botData?.portfolio?.positions &&
        botData.portfolio.positions.length > 0 && (
          <div className="trading-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              📈 Current Positions
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                      Symbol
                    </th>
                    <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                      Size
                    </th>
                    <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                      Mark Price
                    </th>
                    <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                      Unrealized P&L
                    </th>
                    <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {botData.portfolio.positions.map((position, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {position.symbol.replace("USDT", "")}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-mono text-gray-900 dark:text-white">
                          {position.size.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-mono text-gray-900 dark:text-white">
                          {formatCurrency(position.markPrice)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`font-mono font-semibold ${
                            position.unrealizedPnl >= 0
                              ? "trading-green"
                              : "trading-red"
                          }`}
                        >
                          {position.unrealizedPnl >= 0 ? "+" : ""}
                          {formatCurrency(position.unrealizedPnl)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-mono text-gray-900 dark:text-white">
                          {formatPercentage(position.percentage)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* No Data State */}
      {(!botData ||
        !botData.portfolio ||
        (!botData.portfolio.allocations && !botData.portfolio.positions)) && (
        <div className="trading-card p-12 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Portfolio Data Loading
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Waiting for portfolio data from the trading bot...
          </p>
        </div>
      )}
    </div>
  );
}
