"use client";

import { useState } from "react";

interface SpotPortfolioData {
  USDT: number;
  BTC: number;
  ETH: number;
  BNB: number;
  MATIC: number;
  totalValue: number;
}

interface SpotPortfolioProps {
  data: SpotPortfolioData | null;
}

export function SpotPortfolio({ data }: SpotPortfolioProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            💰 Spot Portfolio
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

  const formatCrypto = (amount: number, symbol: string) => {
    if (amount === 0) return "0.00";
    return `${amount.toFixed(6)} ${symbol}`;
  };

  const assets = [
    {
      symbol: "USDT",
      amount: data.USDT,
      value: data.USDT,
      color: "text-green-400",
    },
    {
      symbol: "BTC",
      amount: data.BTC,
      value: data.BTC * 65000,
      color: "text-orange-400",
    },
    {
      symbol: "ETH",
      amount: data.ETH,
      value: data.ETH * 3000,
      color: "text-blue-400",
    },
    {
      symbol: "BNB",
      amount: data.BNB,
      value: data.BNB * 500,
      color: "text-yellow-400",
    },
    {
      symbol: "MATIC",
      amount: data.MATIC,
      value: data.MATIC * 0.4,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center">
          💰 Spot Portfolio
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
          {formatCurrency(data.totalValue)}
        </div>
        <div className="text-sm text-gray-400">Total Value</div>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div
              key={asset.symbol}
              className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${asset.color.replace(
                    "text-",
                    "bg-"
                  )}`}
                ></div>
                <span className="text-white font-medium">{asset.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">
                  {formatCrypto(asset.amount, asset.symbol)}
                </div>
                <div className="text-sm text-gray-400">
                  {formatCurrency(asset.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
