"use client";

import { useState } from "react";

interface FuturesPortfolioData {
  USDT: number;
  totalEquity: number;
  availableBalance: number;
  totalValue: number;
}

interface FuturesPortfolioProps {
  data: FuturesPortfolioData | null;
}

export function FuturesPortfolio({ data }: FuturesPortfolioProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            ⚡ Futures Portfolio
          </h3>
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
        <div className="text-center text-gray-500 py-4">
          Portfolio data not available
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const utilizationRate =
    data.totalEquity > 0 ? (data.USDT / data.totalEquity) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center">
          ⚡ Futures Portfolio
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold text-white">
          {formatCurrency(data.totalEquity)}
        </div>
        <div className="text-sm text-gray-400">Total Equity</div>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Available Balance */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Available Balance</span>
            <div className="text-right">
              <div className="text-white font-medium">
                {formatCurrency(data.availableBalance)}
              </div>
              <div className="text-sm text-gray-400">
                {formatPercentage(data.availableBalance, data.totalEquity)}
              </div>
            </div>
          </div>

          {/* USDT Balance */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">USDT Balance</span>
            <div className="text-right">
              <div className="text-white font-medium">
                {formatCurrency(data.USDT)}
              </div>
              <div className="text-sm text-gray-400">
                {formatPercentage(data.USDT, data.totalEquity)}
              </div>
            </div>
          </div>

          {/* Utilization Rate */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Utilization Rate</span>
              <span className="text-white font-medium">
                {utilizationRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Trading Status */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Trading Status</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  data.availableBalance > 10
                    ? "bg-green-900 text-green-300"
                    : "bg-red-900 text-red-300"
                }`}
              >
                {data.availableBalance > 10 ? "ACTIVE" : "LOW BALANCE"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
