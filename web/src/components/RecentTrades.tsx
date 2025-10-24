"use client";

import React from "react";
import { Trade } from "@/types/bot";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface RecentTradesProps {
  trades?: Trade[];
  className?: string;
}

export function RecentTrades({ trades, className = "" }: RecentTradesProps) {
  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "filled":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "filled":
        return "status-success";
      case "pending":
        return "status-warning";
      case "cancelled":
        return "status-error";
      default:
        return "status-info";
    }
  };

  const getSideClass = (side: string) => {
    return side === "buy" ? "trading-green" : "trading-red";
  };

  const TradeRow = ({ trade }: { trade: Trade }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {trade.symbol.replace("USDT", "").charAt(0)}
            </span>
          </div>
          <span className="font-semibold text-primary">
            {trade.symbol.replace("USDT", "")}
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`font-semibold ${getSideClass(trade.side)}`}>
          {trade.side.toUpperCase()}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="font-mono text-primary">
          {trade.amount.toFixed(4)}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="font-mono text-primary">
          {formatCurrency(trade.price, 4)}
        </span>
      </td>
      <td className="py-4 px-4">
        <span
          className={`font-mono font-semibold ${
            trade.pnl && trade.pnl >= 0 ? "trading-green" : "trading-red"
          }`}
        >
          {trade.pnl !== undefined
            ? `${trade.pnl >= 0 ? "+" : ""}${formatCurrency(trade.pnl)}`
            : "-"}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(trade.status)}
          <span className={`status-indicator ${getStatusClass(trade.status)}`}>
            {trade.status.toUpperCase()}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="font-mono text-muted text-sm">
          {new Date(trade.timestamp).toLocaleTimeString()}
        </span>
      </td>
    </tr>
  );

  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">Recent Trades</h2>
          <p className="text-muted">Latest trading activity and performance</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        {!trades || trades.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-muted text-lg font-medium">
              No Recent Trades
            </div>
            <div className="text-muted text-sm mt-1">
              Trading activity will appear here
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="professional-table">
              <thead>
                <tr>
                  {[
                    "Symbol",
                    "Side",
                    "Amount",
                    "Price",
                    "P&L",
                    "Status",
                    "Time",
                  ].map((header) => (
                    <th key={header} className="text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((trade) => (
                  <TradeRow key={trade.id} trade={trade} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
