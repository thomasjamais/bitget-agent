"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { BotData } from "@/types/bot";

export default function AIAnalysisPage() {
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
            🤖 AI Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Advanced AI-powered market analysis and predictions
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
            {isConnected ? "✅ AI Engine Active" : "🔌 AI Engine Offline"}
          </span>
        </div>
      </div>

      {/* AI Engine Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="trading-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">🧠 AI Engine Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Active</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Model Status:</span>
              <span className="text-white font-medium">Loaded & Ready</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Analysis:</span>
              <span className="text-white font-medium">2 minutes ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Confidence:</span>
              <span className="text-green-400 font-medium">87.3%</span>
            </div>
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">📊 Market Sentiment</h3>
            <div className="text-2xl">📈</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Overall Sentiment:</span>
              <span className="text-green-400 font-medium">Bullish</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fear & Greed Index:</span>
              <span className="text-yellow-400 font-medium">68 (Greed)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volatility:</span>
              <span className="text-orange-400 font-medium">High</span>
            </div>
          </div>
        </div>

        <div className="trading-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">🎯 AI Predictions</h3>
            <div className="text-2xl">🔮</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Next 24h:</span>
              <span className="text-green-400 font-medium">+2.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Next 7d:</span>
              <span className="text-green-400 font-medium">+8.7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Level:</span>
              <span className="text-yellow-400 font-medium">Medium</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Analysis */}
        <div className="trading-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🔍 Current AI Analysis</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-medium text-white mb-2">Market Pattern Recognition</h4>
              <p className="text-gray-300 text-sm">
                AI has identified a bullish flag pattern forming on BTC/USDT with 78% confidence. 
                The pattern suggests a potential breakout above $67,500 resistance level.
              </p>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-medium text-white mb-2">Volume Analysis</h4>
              <p className="text-gray-300 text-sm">
                Unusual volume spike detected in ETH/USDT futures. AI suggests this indicates 
                institutional accumulation with 85% probability of upward price movement.
              </p>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-medium text-white mb-2">Cross-Asset Correlation</h4>
              <p className="text-gray-300 text-sm">
                Strong positive correlation detected between BTC and traditional markets. 
                AI recommends monitoring S&P 500 movements for BTC direction confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="trading-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">💡 AI Recommendations</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-400">✅</span>
                <h4 className="font-medium text-white">Strong Buy Signal</h4>
              </div>
              <p className="text-gray-300 text-sm">
                BTC/USDT showing strong momentum with AI confidence of 89%. 
                Recommended position size: 15% of portfolio.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-yellow-400">⚠️</span>
                <h4 className="font-medium text-white">Caution Signal</h4>
              </div>
              <p className="text-gray-300 text-sm">
                ETH/USDT showing mixed signals. AI suggests waiting for clearer 
                confirmation before entering position.
              </p>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-400">📊</span>
                <h4 className="font-medium text-white">Portfolio Optimization</h4>
              </div>
              <p className="text-gray-300 text-sm">
                AI recommends rebalancing portfolio to 60% BTC, 25% ETH, 10% BNB, 5% MATIC 
                based on current market conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Performance Metrics */}
      <div className="trading-card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">📈 AI Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-400">87.3%</div>
            <div className="text-sm text-gray-400">Prediction Accuracy</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">156</div>
            <div className="text-sm text-gray-400">Signals Generated</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">+23.7%</div>
            <div className="text-sm text-gray-400">AI Portfolio Return</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">2.1</div>
            <div className="text-sm text-gray-400">Sharpe Ratio</div>
          </div>
        </div>
      </div>

      {/* AI Model Details */}
      <div className="trading-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4">🔧 AI Model Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-3">Model Architecture</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Model Type:</span>
                <span className="text-white">Transformer + LSTM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Parameters:</span>
                <span className="text-white">12.5M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Training Data:</span>
                <span className="text-white">5 years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Update:</span>
                <span className="text-white">2 hours ago</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-3">Input Features</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Price Data:</span>
                <span className="text-white">OHLCV + Volume</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Technical Indicators:</span>
                <span className="text-white">25+ indicators</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Sentiment:</span>
                <span className="text-white">Social media + news</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Macro Data:</span>
                <span className="text-white">Economic indicators</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
