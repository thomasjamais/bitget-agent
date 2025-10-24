"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { BotData } from "@/types/bot";

export default function TradesPage() {
  const [botData, setBotData] = useState<BotData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "recent">("all");

  const { data, connected } = useWebSocket("ws://localhost:8081/ws");

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
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filled":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      case "cancelled":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "filled":
        return "✅";
      case "pending":
        return "⏳";
      case "cancelled":
        return "❌";
      default:
        return "❓";
    }
  };

  const getSideColor = (side: string) => {
    return side === "buy"
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getSideIcon = (side: string) => {
    return side === "buy" ? "📈" : "📉";
  };

  // Filter trades based on current filter
  const filteredTrades =
    botData?.recentTrades?.filter((trade) => {
      switch (filter) {
        case "active":
          return trade.status === "pending";
        case "recent":
          return (
            trade.status === "filled" &&
            Date.now() - trade.timestamp < 24 * 60 * 60 * 1000
          ); // Last 24 hours
        default:
          return true;
      }
    }) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ⚡ Active Trades
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Real-time trade monitoring and execution
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

      {/* Trading Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Trades Today
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {botData?.aggressiveTrading?.dailyTrades || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            / {botData?.aggressiveTrading?.maxTradesPerSymbol || 0} max per
            symbol
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Success Rate
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatPercentage(
              (botData?.aggressiveTrading?.successRate || 0) * 100
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {botData?.aggressiveTrading?.tradesExecuted || 0} trades executed
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
            Open positions
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Opportunities Found
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {botData?.aggressiveTrading?.opportunitiesFound || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Today&apos;s opportunities
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="trading-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📊 Trade History
          </h2>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("recent")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "recent"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Recent (24h)
            </button>
          </div>
        </div>

        {filteredTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    Symbol
                  </th>
                  <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    Side
                  </th>
                  <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    Amount
                  </th>
                  <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    Price
                  </th>
                  <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    P&L
                  </th>
                  <th className="text-center py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-right py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {getSideIcon(trade.side)}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {trade.symbol.replace("USDT", "")}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-2">
                      <span
                        className={`font-medium ${getSideColor(trade.side)}`}
                      >
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
                        <span
                          className={`font-mono font-semibold ${
                            trade.pnl >= 0 ? "trading-green" : "trading-red"
                          }`}
                        >
                          {trade.pnl >= 0 ? "+" : ""}
                          {formatCurrency(trade.pnl)}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          -
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          trade.status
                        )}`}
                      >
                        <span className="mr-1">
                          {getStatusIcon(trade.status)}
                        </span>
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
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === "active"
                ? "No Active Trades"
                : filter === "recent"
                ? "No Recent Trades"
                : "No Trades Found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "active"
                ? "All trades have been completed"
                : filter === "recent"
                ? "No trades in the last 24 hours"
                : "Waiting for trade data from the bot..."}
            </p>
          </div>
        )}
      </div>

      {/* Trading Opportunities */}
      {botData?.opportunities && botData.opportunities.length > 0 && (
        <div className="trading-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            🎯 Current Opportunities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {botData.opportunities.slice(0, 6).map((opportunity) => (
              <div
                key={`${opportunity.symbol}-${opportunity.timestamp}`}
                className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {opportunity.symbol.replace("USDT", "")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.direction === "long"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      }`}
                    >
                      {opportunity.direction.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPercentage(opportunity.confidence * 100)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Confidence
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Expected Return:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatPercentage(opportunity.expectedReturn * 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Risk Score:
                    </span>
                    <span
                      className={`font-semibold ${
                        opportunity.riskScore <= 0.3
                          ? "text-green-600 dark:text-green-400"
                          : opportunity.riskScore <= 0.7
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {opportunity.riskScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Priority:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {opportunity.priority.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {opportunity.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
