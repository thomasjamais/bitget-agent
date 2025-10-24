"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { TradingMetrics } from "@/components/TradingMetrics";
import { MarketData } from "@/components/MarketData";
import { RecentTrades } from "@/components/RecentTrades";
import { TradingOpportunities } from "@/components/TradingOpportunities";
import { TradingIntentions } from "@/components/TradingIntentions";
import { AllocationNotifications } from "@/components/AllocationNotifications";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { BotData } from "@/types/bot";
import { WifiOff, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const [botData, setBotData] = useState<BotData | null>(null);

  const { data, connected, error } = useWebSocket();

  // Debug WebSocket connection
  useEffect(() => {
    console.log("🔌 Dashboard WebSocket status:", {
      connected,
      error,
      hasData: !!data,
    });
  }, [connected, error, data]);

  useEffect(() => {
    if (data) {
      setBotData(data as BotData);
    } else {
      // Fetch real data from API when no WebSocket data is available
      fetchRealBotData();
    }
  }, [data]);

  const fetchRealBotData = async () => {
    try {
      // Fetch real data from the bot's API endpoints
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8081/api/bot/status";
      const response = await fetch(apiUrl);
      if (response.ok) {
        const realData = await response.json();
        setBotData(realData);
      } else {
        console.error("Failed to fetch real bot data:", response.statusText);
        setBotData(null);
      }
    } catch (error) {
      console.error("Failed to fetch real bot data:", error);
      setBotData(null);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🚀</span>
            </div>
            <span className="font-semibold text-primary">Trading Bot</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <span className="text-xs text-muted">
              {connected ? "Connected" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <AllocationNotifications />

        {/* Header */}
        <DashboardHeader
          isConnected={connected}
          lastUpdate={botData?.timestamp}
          error={error}
        />

        {/* Main Content */}
        <div className="space-y-6">
          <PortfolioOverview
            portfolio={botData?.portfolio}
            equity={botData?.equity}
            dailyPnL={botData?.dailyPnL}
          />

          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 xl:col-span-3 space-y-6">
              <RecentTrades trades={botData?.recentTrades} />
              <TradingOpportunities opportunities={botData?.opportunities} />
              <TradingIntentions intentions={botData?.intentions} />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              <TradingMetrics
                metrics={botData?.aggressiveTrading}
                uptime={botData?.uptime}
              />
              <MarketData marketData={botData?.marketData} />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Footer - Mobile Optimized */}
      {!connected && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-auto bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Disconnected from bot</span>
          </div>
        </div>
      )}

      {/* Error Banner - Mobile Optimized */}
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-3 shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Connection Error: {error}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
