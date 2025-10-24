"use client";

import React from "react";
import { AggressiveTradingMetrics } from "@/types/bot";
import {
  Zap,
  TrendingUp,
  Target,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface TradingMetricsProps {
  metrics?: AggressiveTradingMetrics;
  uptime?: number;
}

const MetricItem = ({
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

export function TradingMetrics({ metrics, uptime }: TradingMetricsProps) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatus = () => {
    if (!metrics)
      return {
        text: "Unknown",
        color: "text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-800",
      };
    if (metrics.successRate > 0.7)
      return {
        text: "Optimal",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      };
    if (metrics.successRate > 0.4)
      return {
        text: "Moderate",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      };
    return {
      text: "Needs Attention",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    };
  };

  const status = getStatus();

  return (
    <div className="metric-card h-full">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">
            Trading Engine Performance
          </h2>
          <p className="text-muted">
            Real-time trading metrics and system status
          </p>
        </div>
      </div>

      {metrics ? (
        <div className="flex flex-col h-full">
          <div className="space-y-1 flex-grow">
            <MetricItem
              label="Success Rate"
              value={formatPercentage(metrics.successRate)}
              valueClass={status.color}
              icon={<Target className="w-4 h-4 text-green-500" />}
            />
            <MetricItem
              label="Daily Trades"
              value={`${metrics.tradesExecuted} / ${metrics.dailyTrades}`}
              icon={<Activity className="w-4 h-4 text-blue-500" />}
            />
            <MetricItem
              label="Opportunities Found"
              value={metrics.opportunitiesFound}
              icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
            />
            <MetricItem
              label="Portfolio Balance Score"
              value={formatPercentage(metrics.portfolioBalance)}
              icon={<Target className="w-4 h-4 text-indigo-500" />}
            />
            <MetricItem
              label="System Uptime"
              value={formatUptime(uptime || 0)}
              icon={<Clock className="w-4 h-4 text-orange-500" />}
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {status.text === "Optimal" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : status.text === "Needs Attention" ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Activity className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium text-secondary">
                    Engine Status
                  </span>
                </div>
              </div>
              <div
                className={`status-indicator ${status.bgColor} ${status.color}`}
              >
                {status.text}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="text-muted text-lg font-medium">
              Waiting for Trading Metrics
            </div>
            <div className="text-muted text-sm mt-1">
              System is initializing...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
