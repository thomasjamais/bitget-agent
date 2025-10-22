'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { PortfolioOverview } from '@/components/PortfolioOverview';
import { PortfolioControls } from '@/components/PortfolioControls';
import { TradingMetrics } from '@/components/TradingMetrics';
import { MarketData } from '@/components/MarketData';
import { RecentTrades } from '@/components/RecentTrades';
import { TradingOpportunities } from '@/components/TradingOpportunities';
import { AllocationNotifications } from '@/components/AllocationNotifications';
import { TargetAllocationManager } from '@/components/TargetAllocationManager';
import { useWebSocket } from '@/hooks/useWebSocket';
import { BotData } from '@/types/bot';

export default function Dashboard() {
  const [botData, setBotData] = useState<BotData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // WebSocket connection to bot
  const { data, connected, error } = useWebSocket('ws://localhost:8080/ws');
  
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
          // TODO: Implement API call to allocate capital
          console.log('Allocating capital:', amount);
        }}
        onTriggerRebalance={async () => {
          // TODO: Implement API call to trigger rebalance
          console.log('Triggering rebalance');
        }}
        onUpdateAllocation={async (symbol, percentage) => {
          // TODO: Implement API call to update allocation
          console.log('Updating allocation:', symbol, percentage);
        }}
      />

      {/* Target Allocations Manager */}
      <TargetAllocationManager 
        portfolio={botData?.portfolio}
        onUpdateAllocation={async (symbol, percentage) => {
          console.log('Updating allocation:', symbol, percentage);
          // The API call is handled inside the component
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
      
      {/* Market Data and Trading */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MarketData marketData={botData?.marketData} />
        <TradingOpportunities opportunities={botData?.opportunities} />
      </div>
      
      {/* Recent Trades */}
      <RecentTrades 
        trades={botData?.recentTrades}
        className="mb-6"
      />
      
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