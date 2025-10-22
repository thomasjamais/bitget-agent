'use client';

import React, { useState } from 'react';
import { Portfolio } from '@/types/bot';

interface PortfolioControlsProps {
  portfolio?: Portfolio;
  equity?: number;
  onAllocateCapital?: (amount: number) => void;
  onTriggerRebalance?: () => void;
  onUpdateAllocation?: (symbol: string, percentage: number) => void;
}



export function PortfolioControls({ 
  portfolio, 
  equity = 0, 
  onAllocateCapital, 
  onTriggerRebalance,
  onUpdateAllocation
}: PortfolioControlsProps) {
  const [allocationAmount, setAllocationAmount] = useState<number>(0);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [editingAllocations, setEditingAllocations] = useState(false);
  const [tempAllocations, setTempAllocations] = useState<{[key: string]: number}>({});



  const handleAllocateCapital = async () => {
    if (allocationAmount > 0 && allocationAmount <= (equity || 0)) {
      try {
        setIsRebalancing(true);
        
        // Call API directly
        console.log('🚀 Allocating capital:', allocationAmount, 'USDT');
        
        // Show immediate feedback
        const statusMsg = `Allocating ${allocationAmount} USDT to portfolio...`;
        console.log(statusMsg);
        
        const response = await fetch('http://localhost:8080/api/portfolio/allocate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: allocationAmount })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to allocate capital');
        }
        
        console.log('Capital allocated successfully:', result);
        alert(`✅ ${result.message}`);
        
        // Call callback if provided
        if (onAllocateCapital) {
          await onAllocateCapital(allocationAmount);
        }
      } catch (error) {
        console.error('Failed to allocate capital:', error);
        alert(`❌ Failed to allocate capital: ${error}`);
      } finally {
        setIsRebalancing(false);
      }
    }
  };

  const handleTriggerRebalance = async () => {
    try {
      setIsRebalancing(true);
      
      // Call API directly
      console.log('⚖️ Triggering rebalance');
      const response = await fetch('http://localhost:8080/api/portfolio/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to trigger rebalance');
      }
      
      console.log('Rebalance triggered successfully:', result);
      alert(`✅ ${result.message}`);
      
      // Call callback if provided
      if (onTriggerRebalance) {
        await onTriggerRebalance();
      }
    } catch (error) {
      console.error('Failed to trigger rebalance:', error);
      alert(`❌ Failed to trigger rebalance: ${error}`);
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleStartEditing = () => {
    setEditingAllocations(true);
    // Initialize temp allocations with current values
    const temp: {[key: string]: number} = {};
    
    // If no allocations available, use default ones
    const allocations = portfolio?.allocations && portfolio.allocations.length > 0 
      ? portfolio.allocations 
        : [
          { symbol: 'BTCUSDT', target: 0.30, current: 0, deviation: 0, status: 'BALANCED' as const },
          { symbol: 'ETHUSDT', target: 0.25, current: 0, deviation: 0, status: 'BALANCED' as const },
          { symbol: 'BNBUSDT', target: 0.42, current: 0, deviation: 0, status: 'BALANCED' as const },
          { symbol: 'MATICUSDT', target: 0.03, current: 0, deviation: 0, status: 'BALANCED' as const }
        ];
    
    allocations.forEach(alloc => {
      temp[alloc.symbol] = alloc.target * 100;
    });
    setTempAllocations(temp);
  };

  const handleSaveAllocations = async () => {
    try {
      // Update allocations via API
      console.log('📝 Updating allocations:', tempAllocations);
      const updates = Object.entries(tempAllocations).map(async ([symbol, percentage]) => {
        const response = await fetch(`http://localhost:8080/api/portfolio/allocation/${symbol}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ percentage: percentage / 100 })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to update ${symbol}: ${error.error}`);
        }
        
        return response.json();
      });
      
      await Promise.all(updates);
      
      console.log('All allocations updated successfully');
      alert('✅ Portfolio allocations updated successfully');
      
      // Call callbacks if provided
      if (onUpdateAllocation) {
        Object.entries(tempAllocations).forEach(([symbol, percentage]) => {
          onUpdateAllocation(symbol, percentage / 100);
        });
      }
      
      setEditingAllocations(false);
    } catch (error) {
      console.error('Failed to save allocations:', error);
      alert(`❌ Failed to save allocations: ${error}`);
    }
  };

  const totalAllocation = Object.values(tempAllocations).reduce((sum, val) => sum + val, 0);

  return (
    <div className="trading-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🎛️ Portfolio Controls
        </h2>
        <div className="flex gap-2">
          {portfolio?.rebalanceNeeded && (
            <button
              onClick={handleTriggerRebalance}
              disabled={isRebalancing}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRebalancing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Rebalancing...
                </>
              ) : (
                <>⚖️ Trigger Rebalance</>
              )}
            </button>
          )}
          {!editingAllocations ? (
            <button
              onClick={handleStartEditing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              📝 Edit Allocations
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingAllocations(false)}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAllocations}
                disabled={Math.abs(totalAllocation - 100) > 0.1}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Capital Allocation Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          💰 Capital Allocation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Balance</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(equity || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Portfolio Value</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(portfolio?.totalValue || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount to Allocate (USD)
            </label>
            <input
              type="number"
              min="10"
              max={equity || 0}
              step="1"
              value={allocationAmount}
              onChange={(e) => setAllocationAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount in USD"
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              💡 Minimum recommended: $40 USDT (to meet $10 minimum per trade)
              {allocationAmount < 40 && allocationAmount > 0 && (
                <div className="text-orange-600 dark:text-orange-400">
                  ⚠️ Amount may be too small for some allocations
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleAllocateCapital}
            disabled={isRebalancing || allocationAmount <= 0 || allocationAmount > (equity || 0)}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRebalancing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Allocating...
              </>
            ) : (
              <>🚀 Allocate & Start Trading</>
            )}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            💡 This will allocate ${allocationAmount.toFixed(2)} to the trading portfolio and trigger automatic rebalancing according to your target allocations.
          </div>
          <div className="text-sm">
            <div className="text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Minimum required for full allocation: 34 USDT
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              With less than 34 USDT, some smaller allocations will fail (need 10+ USDT per symbol)
            </div>
            {allocationAmount < 34 && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                ⚠️ Current amount (${allocationAmount.toFixed(2)}) is below minimum - some allocations will fail
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allocation Editor */}
      {editingAllocations && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            📝 Edit Target Allocations
          </h3>
          
          <>
            {!portfolio?.allocations && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                ℹ️ Using default allocations (live data not available)
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {(portfolio?.allocations && portfolio.allocations.length > 0 
                ? portfolio.allocations 
                :                   [
                    { symbol: 'BTCUSDT', target: 0.30, current: 0, deviation: 0, status: 'BALANCED' as const },
                    { symbol: 'ETHUSDT', target: 0.25, current: 0, deviation: 0, status: 'BALANCED' as const },
                    { symbol: 'BNBUSDT', target: 0.42, current: 0, deviation: 0, status: 'BALANCED' as const },
                    { symbol: 'MATICUSDT', target: 0.03, current: 0, deviation: 0, status: 'BALANCED' as const }
                  ]
              ).map((allocation) => (
              <div key={allocation.symbol} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {allocation.symbol.replace('USDT', '')}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={tempAllocations[allocation.symbol] || 0}
                    onChange={(e) => setTempAllocations(prev => ({
                      ...prev,
                      [allocation.symbol]: Number(e.target.value)
                    }))}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`text-sm font-medium ${
              Math.abs(totalAllocation - 100) < 0.1 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              Total: {totalAllocation.toFixed(1)}% {Math.abs(totalAllocation - 100) < 0.1 ? '✅' : '❌ Must equal 100%'}
            </div>
            <button
              onClick={() => {
                // Auto-balance to 100%
                const entries = Object.entries(tempAllocations);
                const factor = 100 / totalAllocation;
                const balanced: {[key: string]: number} = {};
                entries.forEach(([symbol, value]) => {
                  balanced[symbol] = Number((value * factor).toFixed(1));
                });
                setTempAllocations(balanced);
              }}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              🎯 Auto Balance
            </button>
          </div>
          </>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setAllocationAmount(25)}
          className="p-3 text-center border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white">Conservative</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">25% of balance</div>
        </button>
        
        <button
          onClick={() => setAllocationAmount(Math.round((equity || 0) * 0.5))}
          className="p-3 text-center border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white">Balanced</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">50% of balance</div>
        </button>
        
        <button
          onClick={() => setAllocationAmount(Math.round((equity || 0) * 0.8))}
          className="p-3 text-center border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white">Aggressive</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">80% of balance</div>
        </button>
      </div>
    </div>
  );
}