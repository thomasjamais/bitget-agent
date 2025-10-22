'use client';

import React, { useState, useEffect } from 'react';
import { Portfolio, Allocation } from '@/types/bot';

interface TargetAllocationManagerProps {
  portfolio?: Portfolio;
  onUpdateAllocation?: (symbol: string, percentage: number) => void;
}

export function TargetAllocationManager({ 
  portfolio, 
  onUpdateAllocation 
}: TargetAllocationManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAllocations, setTempAllocations] = useState<{[key: string]: number}>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize temp allocations from portfolio data
  useEffect(() => {
    if (portfolio?.allocations && !isEditing) {
      const temp: {[key: string]: number} = {};
      portfolio.allocations.forEach(alloc => {
        temp[alloc.symbol] = alloc.target * 100; // Convert to percentage
      });
      setTempAllocations(temp);
    }
  }, [portfolio?.allocations, isEditing]);

  const totalAllocation = Object.values(tempAllocations).reduce((sum, val) => sum + val, 0);

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    // Reset temp allocations
    if (portfolio?.allocations) {
      const temp: {[key: string]: number} = {};
      portfolio.allocations.forEach(alloc => {
        temp[alloc.symbol] = alloc.target * 100;
      });
      setTempAllocations(temp);
    }
  };

  const handleSaveAllocations = async () => {
    if (Math.abs(totalAllocation - 100) > 0.1) {
      alert('Total allocation must equal 100%');
      return;
    }

    setIsSaving(true);
    try {
      // Update each allocation via API
      for (const [symbol, percentage] of Object.entries(tempAllocations)) {
        const response = await fetch(`http://localhost:8080/api/portfolio/allocation/${symbol}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ percentage: percentage / 100 }) // Convert back to decimal
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to update ${symbol}`);
        }

        if (onUpdateAllocation) {
          await onUpdateAllocation(symbol, percentage / 100);
        }
      }

      setIsEditing(false);
      alert('✅ Target allocations updated successfully!');
    } catch (error) {
      console.error('Failed to update allocations:', error);
      alert(`❌ Failed to update allocations: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAllocationChange = (symbol: string, value: number) => {
    setTempAllocations(prev => ({
      ...prev,
      [symbol]: Math.max(0, Math.min(100, value))
    }));
  };

  const getStatusColor = (allocation: Allocation) => {
    switch (allocation.status) {
      case 'BALANCED': return 'text-green-600 bg-green-50 border-green-200';
      case 'OVERWEIGHT': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'UNDERWEIGHT': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'BALANCED': return '🟢';
      case 'OVERWEIGHT': return '🔴';
      case 'UNDERWEIGHT': return '🟡';
      default: return '⚪';
    }
  };

  if (!portfolio?.allocations || portfolio.allocations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No allocations configured
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          🎯 Target Allocations
          {totalAllocation !== 100 && isEditing && (
            <span className="text-sm text-red-500">
              ({totalAllocation.toFixed(1)}%)
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleStartEditing}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              ✏️ Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEditing}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAllocations}
                disabled={Math.abs(totalAllocation - 100) > 0.1 || isSaving}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {portfolio.allocations.map((allocation) => (
          <div
            key={allocation.symbol}
            className={`p-3 rounded-lg border ${getStatusColor(allocation)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium">{allocation.symbol}</span>
                <span className="text-sm">
                  {getStatusIcon(allocation.status)} {allocation.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>Current: {(allocation.current * 100).toFixed(1)}%</span>
                {!isEditing ? (
                  <span className="font-medium">Target: {(allocation.target * 100).toFixed(1)}%</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Target:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={tempAllocations[allocation.symbol] || 0}
                      onChange={(e) => handleAllocationChange(allocation.symbol, Number(e.target.value))}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                    />
                    <span>%</span>
                  </div>
                )}
                <span>Deviation: {(allocation.deviation * 100).toFixed(1)}%</span>
              </div>
            </div>
            {allocation.value && (
              <div className="text-xs text-gray-600 mt-1">
                Value: ${allocation.value.toFixed(2)} USDT
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Allocation: <span className={`font-medium ${Math.abs(totalAllocation - 100) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
              {totalAllocation.toFixed(1)}%
            </span>
            {Math.abs(totalAllocation - 100) > 0.1 && (
              <span className="text-red-600 ml-2">
                ⚠️ Must equal 100%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}