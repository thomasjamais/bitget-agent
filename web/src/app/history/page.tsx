"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { BotData } from "@/types/bot";

export default function HistoryPage() {
  const [botData, setBotData] = useState<BotData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h"
  );
  const [sortBy, setSortBy] = useState<"time" | "pnl" | "symbol">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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

  // Filter trades by time range
  const getFilteredTrades = () => {
    if (!botData?.recentTrades) return [];

    const now = Date.now();
    const timeRanges = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    return botData.recentTrades.filter(
      (trade) => now - trade.timestamp <= timeRanges[timeRange]
    );
  };

  // Sort trades
  const getSortedTrades = () => {
    const trades = getFilteredTrades();

    return trades.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "time":
          comparison = a.timestamp - b.timestamp;
          break;
        case "pnl":
          comparison = (a.pnl || 0) - (b.pnl || 0);
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const sortedTrades = getSortedTrades();

  // Calculate statistics
  const stats = {
    totalTrades: sortedTrades.length,
    totalPnL: sortedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0),
    winningTrades: sortedTrades.filter((trade) => (trade.pnl || 0) > 0).length,
    losingTrades: sortedTrades.filter((trade) => (trade.pnl || 0) < 0).length,
    winRate:
      sortedTrades.length > 0
        ? (sortedTrades.filter((trade) => (trade.pnl || 0) > 0).length /
            sortedTrades.length) *
          100
        : 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📈 Trade History
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive trading performance analysis
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Trades
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.totalTrades}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last {timeRange}
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total P&L
          </div>
          <div
            className={`text-3xl font-bold ${
              stats.totalPnL >= 0 ? "trading-green" : "trading-red"
            }`}
          >
            {formatCurrency(stats.totalPnL)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatPercentage(
              (stats.totalPnL / Math.max(botData?.equity || 1, 1)) * 100
            )}{" "}
            of equity
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Win Rate
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatPercentage(stats.winRate)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.winningTrades}W / {stats.losingTrades}L
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg P&L per Trade
          </div>
          <div
            className={`text-3xl font-bold ${
              stats.totalTrades > 0
                ? stats.totalPnL / stats.totalTrades >= 0
                  ? "trading-green"
                  : "trading-red"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {stats.totalTrades > 0
              ? formatCurrency(stats.totalPnL / stats.totalTrades)
              : "$0.00"}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Per trade average
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="trading-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📊 Trade History
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range:
              </label>
              <select
                value={timeRange}
                onChange={(e) =>
                  setTimeRange(e.target.value as "1h" | "24h" | "7d" | "30d")
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "time" | "pnl" | "symbol")
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="time">Time</option>
                <option value="pnl">P&L</option>
                <option value="symbol">Symbol</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        {sortedTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">
                    Time
                  </th>
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
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatDate(trade.timestamp)}
                      </div>
                    </td>

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Trades Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No trades found for the selected time range ({timeRange}).
            </p>
          </div>
        )}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="trading-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          📊 Performance Chart
        </h2>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-lg text-center">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Performance Visualization
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive performance charts will be available here showing P&L
            over time, win/loss streaks, and trading patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
