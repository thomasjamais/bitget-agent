"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface TradingIntention {
  id: string;
  symbol: string;
  direction: "long" | "short";
  quantity: number;
  leverage: number;
  confidence: number;
  timestamp: number;
  status: "pending" | "executed" | "failed" | "cancelled";
  result?: {
    orderId?: string;
    error?: string;
    executionTime?: number;
  };
}

interface TradingIntentionsProps {
  intentions?: TradingIntention[];
}

export function TradingIntentions({ intentions = [] }: TradingIntentionsProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "cancelled":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "executed":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "failed":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "cancelled":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const sortedIntentions = intentions.sort(
    (a, b) => b.timestamp - a.timestamp
  );

  return (
    <div className="trading-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🎯 Trading Intentions & Results
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {sortedIntentions.length} intentions
        </div>
      </div>

      {sortedIntentions.length > 0 ? (
        <div className="space-y-4">
          {sortedIntentions.slice(0, 10).map((intention) => (
            <div
              key={intention.id}
              className={`p-4 rounded-lg border ${getStatusColor(
                intention.status
              )}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(intention.status)}
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {intention.symbol.replace("USDT", "")}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                      intention.direction === "long"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {intention.direction === "long" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{intention.direction.toUpperCase()}</span>
                  </span>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${getConfidenceColor(
                      intention.confidence
                    )}`}
                  >
                    {formatPercentage(intention.confidence)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence
                  </div>
                </div>
              </div>

              {/* Trade Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Quantity
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(intention.quantity)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Leverage
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {intention.leverage}x
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Status
                  </div>
                  <div
                    className={`text-sm font-semibold capitalize ${
                      intention.status === "executed"
                        ? "text-green-600 dark:text-green-400"
                        : intention.status === "failed"
                        ? "text-red-600 dark:text-red-400"
                        : intention.status === "cancelled"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {intention.status}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Time
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(intention.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Result Details */}
              {intention.result && (
                <div className="bg-white dark:bg-gray-800/50 p-3 rounded text-sm">
                  {intention.status === "executed" &&
                    intention.result.orderId && (
                      <div className="text-green-600 dark:text-green-400">
                        ✅ Order executed successfully
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Order ID: {intention.result.orderId}
                          {intention.result.executionTime && (
                            <span className="ml-2">
                              (Executed in {intention.result.executionTime}ms)
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  {intention.status === "failed" && intention.result.error && (
                    <div className="text-red-600 dark:text-red-400">
                      ❌ Order failed: {intention.result.error}
                    </div>
                  )}

                  {intention.status === "cancelled" && (
                    <div className="text-yellow-600 dark:text-yellow-400">
                      ⚠️ Order cancelled
                    </div>
                  )}

                  {intention.status === "pending" && (
                    <div className="text-blue-600 dark:text-blue-400">
                      ⏳ Order pending execution...
                    </div>
                  )}
                </div>
              )}

              {/* Status Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      intention.status === "executed"
                        ? "bg-green-400"
                        : intention.status === "failed"
                        ? "bg-red-400"
                        : intention.status === "cancelled"
                        ? "bg-yellow-400"
                        : "bg-blue-400"
                    }`}
                    style={{
                      width:
                        intention.status === "executed"
                          ? "100%"
                          : intention.status === "failed"
                          ? "100%"
                          : intention.status === "cancelled"
                          ? "100%"
                          : "50%",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {sortedIntentions.length > 10 && (
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                +{sortedIntentions.length - 10} more intentions
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-gray-600 dark:text-gray-400 mb-2">
            No trading intentions yet
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            The bot will show buying intentions and execution results here...
          </div>
        </div>
      )}
    </div>
  );
}

