"use client";

import React from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import {
  Brain,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Cpu,
  Database,
} from "lucide-react";

// Helper components for a cleaner structure

const MetricCard = ({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div className="metric-card">
    <div className="flex items-center space-x-3 mb-4">
      {icon}
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

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
  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <div className="flex items-center space-x-2">
      {icon}
      <span className="text-sm font-medium text-secondary">{label}</span>
    </div>
    <span className={`text-base font-semibold text-primary ${valueClass}`}>
      {value}
    </span>
  </div>
);

const InsightCard = ({
  icon,
  title,
  children,
  titleColor = "text-primary",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  titleColor?: string;
}) => (
  <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600">
    <div className="flex items-center mb-4">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
        {icon}
      </div>
      <h4 className={`font-semibold text-lg ${titleColor}`}>{title}</h4>
    </div>
    <p className="text-sm text-secondary leading-relaxed">{children}</p>
  </div>
);

const PerformanceMetric = ({
  value,
  label,
  valueColor = "text-blue-600 dark:text-blue-400",
  icon,
}: {
  value: string | number;
  label: string;
  valueColor?: string;
  icon?: React.ReactNode;
}) => (
  <div className="text-center metric-card p-6">
    <div className="flex items-center justify-center mb-3">{icon}</div>
    <div className={`text-3xl font-bold ${valueColor} mb-2`}>{value}</div>
    <div className="text-sm text-muted">{label}</div>
  </div>
);

export default function AIAnalysisPage() {
  const { connected } = useWebSocket();

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-primary">
                AI-Powered Analysis
              </h1>
              <p className="text-secondary text-lg">
                Advanced market intelligence and trading insights
              </p>
            </div>
          </div>
          <p className="text-muted text-base max-w-3xl">
            Leveraging cutting-edge machine learning algorithms to analyze
            market patterns, sentiment, and trading opportunities with
            unprecedented accuracy.
          </p>
        </div>
        <div className="flex items-center space-x-4 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <Activity className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-primary">
              {connected ? "AI Engine: Active" : "AI Engine: Offline"}
            </div>
            <div className="text-xs text-muted">
              {connected ? "Real-time analysis running" : "Connection lost"}
            </div>
          </div>
        </div>
      </div>

      {/* Top-level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="AI Engine Status"
          icon={
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
          }
        >
          <MetricItem
            label="Model Status"
            value="Loaded & Ready"
            icon={<CheckCircle className="w-4 h-4 text-green-500" />}
          />
          <MetricItem
            label="Last Analysis"
            value="2 minutes ago"
            icon={<Activity className="w-4 h-4 text-blue-500" />}
          />
          <MetricItem
            label="Overall Confidence"
            value="87.3%"
            valueClass="trading-green"
            icon={<Target className="w-4 h-4 text-green-500" />}
          />
        </MetricCard>

        <MetricCard
          title="Market Sentiment"
          icon={
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
          }
        >
          <MetricItem
            label="Overall Sentiment"
            value="Bullish"
            valueClass="trading-green"
            icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          />
          <MetricItem
            label="Fear & Greed Index"
            value="68 (Greed)"
            valueClass="trading-yellow"
            icon={<Activity className="w-4 h-4 text-yellow-500" />}
          />
          <MetricItem
            label="Volatility"
            value="High"
            valueClass="trading-yellow"
            icon={<Zap className="w-4 h-4 text-orange-500" />}
          />
        </MetricCard>

        <MetricCard
          title="AI Predictions"
          icon={
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
          }
        >
          <MetricItem
            label="BTC Price (24h)"
            value="+2.3%"
            valueClass="trading-green"
            icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          />
          <MetricItem
            label="ETH Price (7d)"
            value="+8.7%"
            valueClass="trading-green"
            icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          />
          <MetricItem
            label="Market Risk Level"
            value="Medium"
            valueClass="trading-yellow"
            icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}
          />
        </MetricCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Insights & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-primary">
              Actionable Insights
            </h2>
          </div>
          <div className="space-y-6">
            <InsightCard
              icon={<CheckCircle className="w-5 h-5 text-white" />}
              title="Strong Buy Signal: BTC/USDT"
              titleColor="trading-green"
            >
              AI confidence is at 89% for a continued upward trend. Analysis
              suggests a bullish flag pattern breakout, targeting $69,500.
              Recommended entry with 15% of portfolio allocation.
            </InsightCard>
            <InsightCard
              icon={<Activity className="w-5 h-5 text-white" />}
              title="Volume Anomaly: ETH/USDT"
              titleColor="trading-blue"
            >
              Unusual volume spike detected in futures markets, indicating
              potential institutional accumulation. High probability (85%) of
              upward price movement in the short term with strong momentum
              indicators.
            </InsightCard>
            <InsightCard
              icon={<AlertTriangle className="w-5 h-5 text-white" />}
              title="Caution Signal: Altcoins"
              titleColor="trading-yellow"
            >
              AI suggests waiting for clearer confirmation before entering new
              altcoin positions. BTC dominance is rising, indicating a potential
              flight to safety and market consolidation phase.
            </InsightCard>
            <InsightCard
              icon={<Target className="w-5 h-5 text-white" />}
              title="Portfolio Optimization"
              titleColor="trading-blue"
            >
              Based on current risk and momentum scores, AI recommends
              rebalancing portfolio to 60% BTC, 25% ETH, 10% BNB, and 5% MATIC
              to maximize risk-adjusted returns and optimize Sharpe ratio.
            </InsightCard>
          </div>
        </div>

        {/* Right Column: Performance & Model Details */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-primary">
                AI Performance
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PerformanceMetric
                value="87.3%"
                label="Prediction Accuracy"
                valueColor="trading-green"
                icon={<Target className="w-6 h-6 text-green-500" />}
              />
              <PerformanceMetric
                value="156"
                label="Signals Generated (24h)"
                icon={<Activity className="w-6 h-6 text-blue-500" />}
              />
              <PerformanceMetric
                value="+23.7%"
                label="AI Portfolio ROI"
                valueColor="trading-green"
                icon={<TrendingUp className="w-6 h-6 text-green-500" />}
              />
              <PerformanceMetric
                value="2.1"
                label="Sharpe Ratio"
                icon={<BarChart3 className="w-6 h-6 text-purple-500" />}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-primary">Model Details</h2>
            </div>
            <div className="metric-card space-y-3">
              <MetricItem
                label="Model Type"
                value="Transformer + LSTM"
                icon={<Cpu className="w-4 h-4 text-blue-500" />}
              />
              <MetricItem
                label="Parameters"
                value="12.5M"
                icon={<Database className="w-4 h-4 text-green-500" />}
              />
              <MetricItem
                label="Training Data"
                value="5 years historical"
                icon={<Activity className="w-4 h-4 text-purple-500" />}
              />
              <MetricItem
                label="Input Features"
                value="45+ (OHLCV, Social, etc.)"
                icon={<BarChart3 className="w-4 h-4 text-orange-500" />}
              />
              <MetricItem
                label="Last Update"
                value="2 hours ago"
                icon={<Activity className="w-4 h-4 text-blue-500" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
