"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { PortfolioControls } from "@/components/PortfolioControls";
import { TradingMetrics } from "@/components/TradingMetrics";
import { MarketData } from "@/components/MarketData";
import { RecentTrades } from "@/components/RecentTrades";
import { TradingOpportunities } from "@/components/TradingOpportunities";
import { AllocationNotifications } from "@/components/AllocationNotifications";
import { TargetAllocationManager } from "@/components/TargetAllocationManager";
import { useWebSocket } from "@/hooks/useWebSocket";
import { BotData } from "@/types/bot";

export default function Dashboard() {
  const [botData, setBotData] = useState<BotData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection to bot
  const { data, connected, error } = useWebSocket("ws://localhost:8080/ws");

  useEffect(() => {
    setIsConnected(connected);
    if (data) {
      setBotData(data as BotData);
    }
  }, [data, connected]);

  return (
    <div className="p-6 space-y-6">
      {/* Allocation notifications overlay */}
      <AllocationNotifications />

      {/* Header with connection status */}
      <DashboardHeader
        isConnected={isConnected}
        lastUpdate={botData?.timestamp}
        error={error}
      />

      {/* Portfolio Controls */}
      <PortfolioControls
        portfolio={botData?.portfolio}
        equity={botData?.equity}
        onAllocateCapital={async (amount) => {
          try {
            const response = await fetch("http://localhost:8080/api/portfolio/allocate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount }),
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to allocate capital");
            }
            
            const result = await response.json();
            console.log("✅ Capital allocated successfully:", result.message);
          } catch (error) {
            console.error("❌ Failed to allocate capital:", error);
            alert(`❌ Failed to allocate capital: ${error}`);
          }
        }}
        onTriggerRebalance={async () => {
          try {
            const response = await fetch("http://localhost:8080/api/portfolio/rebalance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to trigger rebalance");
            }
            
            const result = await response.json();
            console.log("✅ Rebalance triggered successfully:", result.message);
          } catch (error) {
            console.error("❌ Failed to trigger rebalance:", error);
            alert(`❌ Failed to trigger rebalance: ${error}`);
          }
        }}
        onUpdateAllocation={async (symbol, percentage) => {
          try {
            const response = await fetch(`http://localhost:8080/api/portfolio/allocation/${symbol}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ percentage }),
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to update allocation");
            }
            
            const result = await response.json();
            console.log("✅ Allocation updated successfully:", result.message);
          } catch (error) {
            console.error("❌ Failed to update allocation:", error);
            alert(`❌ Failed to update allocation: ${error}`);
          }
        }}
      />

      {/* Target Allocations Manager */}
      <TargetAllocationManager
        portfolio={botData?.portfolio}
        onUpdateAllocation={async (symbol, percentage) => {
          try {
            const response = await fetch(`http://localhost:8080/api/portfolio/allocation/${symbol}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ percentage }),
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to update allocation");
            }
            
            const result = await response.json();
            console.log("✅ Allocation updated successfully:", result.message);
          } catch (error) {
            console.error("❌ Failed to update allocation:", error);
            alert(`❌ Failed to update allocation: ${error}`);
          }
        }}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Overview - Takes 2/3 width */}
        <div className="lg:col-span-2">
          <PortfolioOverview
            portfolio={botData?.portfolio}
            equity={botData?.equity}
            dailyPnL={botData?.dailyPnL}
          />
        </div>

        {/* Trading Metrics - Takes 1/3 width */}
        <div>
          <TradingMetrics
            metrics={botData?.aggressiveTrading}
            uptime={botData?.uptime}
          />
        </div>
      </div>

      {/* AI Analysis Card */}
      <div className="trading-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            🤖 AI Analysis
          </h2>
          <a
            href="/ai-analysis"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View Full Analysis →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white">
                AI Engine Status
              </span>
            </div>
            <div className="text-xs text-gray-400">
              <div>Model: Active (87.3% confidence)</div>
              <div>Last Analysis: 2 minutes ago</div>
            </div>
          </div>

          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-400">📈</span>
              <span className="text-sm font-medium text-white">
                Market Sentiment
              </span>
            </div>
            <div className="text-xs text-gray-400">
              <div>Overall: Bullish</div>
              <div>Fear & Greed: 68 (Greed)</div>
            </div>
          </div>

          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">🔮</span>
              <span className="text-sm font-medium text-white">
                AI Predictions
              </span>
            </div>
            <div className="text-xs text-gray-400">
              <div>Next 24h: +2.3%</div>
              <div>Next 7d: +8.7%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400">✅</span>
            <span className="font-medium text-white">Strong Buy Signal</span>
          </div>
          <p className="text-gray-300 text-sm">
            BTC/USDT showing strong momentum with AI confidence of 89%.
            Recommended position size: 15% of portfolio.
          </p>
        </div>
      </div>

      {/* Market Data and Trading */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MarketData marketData={botData?.marketData} />
        <TradingOpportunities opportunities={botData?.opportunities} />
      </div>

      {/* Recent Trades */}
      <RecentTrades trades={botData?.recentTrades} className="mb-6" />

      {/* Connection Status Footer */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          🔌 Disconnected from bot
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg">
          ⚠️ WebSocket error: {error}
        </div>
      )}
    </div>
  );
}
