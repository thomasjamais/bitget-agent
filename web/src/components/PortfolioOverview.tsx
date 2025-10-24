"use client";

import React from "react";
import { Portfolio } from "@/types/bot";
import { TrendingUp, Wallet, DollarSign, AlertCircle } from "lucide-react";

interface PortfolioOverviewProps {
  portfolio?: Portfolio;
  equity?: number;
  dailyPnL?: number;
  autoBalanceStatus?: {
    lastTriggered?: string | null;
    lastSuccess?: string | null;
    lastError?: string | null;
    isActive?: boolean;
  };
}

export function PortfolioOverview({
  portfolio,
  equity,
  dailyPnL,
}: PortfolioOverviewProps) {
  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const futuresPortfolio = portfolio?.dualPortfolio?.futures;
  const spotPortfolio = portfolio?.dualPortfolio?.spot;
  const openPositions = portfolio?.positions?.filter((p) => p.size > 0);

  const StatItem = ({
    label,
    value,
    valueClass = "",
    icon,
  }: {
    label: string;
    value: string | number;
    valueClass?: string;
    icon?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm font-medium text-secondary">{label}</span>
      </div>
      <span className={`text-base font-semibold text-primary ${valueClass}`}>
        {value}
      </span>
    </div>
  );

  const PositionCard = ({ position }: { position: any }) => (
    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-bold text-primary text-lg">
              {position.symbol}
            </span>
            <span
              className={`status-indicator ${
                position.unrealizedPnl >= 0 ? "status-success" : "status-error"
              }`}
            >
              {formatCurrency(position.unrealizedPnl)}
            </span>
          </div>
          <div className="text-sm text-muted">
            Size: {position.size.toFixed(3)} @{" "}
            {formatCurrency(position.markPrice, 4)}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-lg font-bold ${
              position.unrealizedPnl >= 0 ? "trading-green" : "trading-red"
            }`}
          >
            {position.unrealizedPnl >= 0 ? "+" : ""}
            {formatCurrency(position.unrealizedPnl)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Futures Portfolio */}
      <div className="lg:col-span-3 metric-card slide-in">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Futures Trading Portfolio
            </h2>
            <p className="text-muted">
              Active trading positions and performance
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <StatItem
            label="Total Equity"
            value={formatCurrency(futuresPortfolio?.totalEquity || equity || 0)}
            icon={<DollarSign className="w-4 h-4 text-green-500" />}
          />
          <StatItem
            label="Available Balance"
            value={formatCurrency(futuresPortfolio?.availableBalance || 0)}
            icon={<Wallet className="w-4 h-4 text-blue-500" />}
          />
          <StatItem
            label="Today's P&L"
            value={formatCurrency(dailyPnL || 0)}
            valueClass={(dailyPnL || 0) >= 0 ? "trading-green" : "trading-red"}
            icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
          />
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Open Positions
          </h3>
          <div className="space-y-3">
            {openPositions && openPositions.length > 0 ? (
              openPositions.map((pos) => (
                <PositionCard key={pos.symbol} position={pos} />
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-muted text-lg font-medium">
                  No Open Positions
                </div>
                <div className="text-muted text-sm mt-1">
                  Start trading to see positions here
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spot Wallet */}
      <div className="lg:col-span-2 metric-card slide-in">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Spot Asset Wallet
            </h2>
            <p className="text-muted">Available trading assets</p>
          </div>
        </div>

        <div className="space-y-1">
          <StatItem
            label="Total Spot Value"
            value={formatCurrency(spotPortfolio?.totalValue || 0)}
            icon={<DollarSign className="w-4 h-4 text-green-500" />}
          />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-blue-500" />
            Asset Holdings
          </h3>
          <div className="space-y-2">
            {spotPortfolio ? (
              Object.entries(spotPortfolio)
                .filter(([key]) => key !== "totalValue")
                .map(([coin, balance]) => (
                  <div
                    key={coin}
                    className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {coin.charAt(0)}
                        </span>
                      </div>
                      <span className="font-semibold text-primary">{coin}</span>
                    </div>
                    <span className="font-mono text-primary">
                      {coin === "USDT"
                        ? formatCurrency(balance as number)
                        : (balance as number).toFixed(5)}
                    </span>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-muted">No spot data available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
