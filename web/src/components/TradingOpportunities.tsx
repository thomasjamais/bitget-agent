'use client';

import React from 'react';
import { TradingOpportunity } from '@/types/bot';

interface TradingOpportunitiesProps {
  opportunities?: TradingOpportunity[];
}

export function TradingOpportunities({ opportunities }: TradingOpportunitiesProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    if (confidence >= 0.35) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (confidence >= 0.6) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (confidence >= 0.35) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 0.3) return 'text-green-600 dark:text-green-400';
    if (risk <= 0.7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const sortedOpportunities = opportunities?.sort((a, b) => b.priority - a.priority) || [];

  return (
    <div className="trading-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        🎯 Trading Opportunities
      </h2>
      
      {sortedOpportunities.length > 0 ? (
        <div className="space-y-4">
          {sortedOpportunities.slice(0, 5).map((opportunity, index) => (
            <div 
              key={`${opportunity.symbol}-${opportunity.timestamp}`} 
              className={`p-4 rounded-lg border ${getConfidenceBg(opportunity.confidence)}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {opportunity.symbol.replace('USDT', '')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    opportunity.direction === 'long' ? 
                    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {opportunity.direction.toUpperCase()}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                      🥇 TOP PRIORITY
                    </span>
                  )}
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${getConfidenceColor(opportunity.confidence)}`}>
                    {formatPercentage(opportunity.confidence)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence
                  </div>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Expected Return</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPercentage(opportunity.expectedReturn)}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Risk Score</div>
                  <div className={`text-sm font-semibold ${getRiskColor(opportunity.riskScore)}`}>
                    {opportunity.riskScore.toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Priority</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {opportunity.priority.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Reason */}
              <div className="bg-white dark:bg-gray-800/50 p-3 rounded text-sm">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Analysis:</div>
                <div className="text-gray-800 dark:text-gray-200">
                  {opportunity.reason}
                </div>
              </div>
              
              {/* Priority Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      opportunity.priority >= 3 ? 'bg-green-400' :
                      opportunity.priority >= 2 ? 'bg-yellow-400' :
                      opportunity.priority >= 1 ? 'bg-orange-400' :
                      'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(opportunity.priority * 25, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Detected: {new Date(opportunity.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {sortedOpportunities.length > 5 && (
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                +{sortedOpportunities.length - 5} more opportunities available
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-gray-600 dark:text-gray-400 mb-2">
            No trading opportunities found
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            The aggressive engine is scanning for opportunities...
          </div>
        </div>
      )}
    </div>
  );
}