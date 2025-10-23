"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";

interface AutoBalanceStatusProps {
  className?: string;
}

interface AutoBalanceEvent {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: number;
  details?: any;
}

export function AutoBalanceStatus({ className = "" }: AutoBalanceStatusProps) {
  const [events, setEvents] = useState<AutoBalanceEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Listen for WebSocket messages
    const ws = new WebSocket("ws://localhost:8080/ws");
    
    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Listen for auto-balance events
        if (data.type === "auto_balance_success") {
          setEvents(prev => [{
            id: `success_${Date.now()}`,
            type: "success",
            title: "Auto-Balance Success",
            message: data.message || "Portfolio automatically balanced",
            timestamp: Date.now(),
            details: data.details
          }, ...prev.slice(0, 4)]); // Keep last 5 events
        }
        
        if (data.type === "auto_balance_error") {
          setEvents(prev => [{
            id: `error_${Date.now()}`,
            type: "error", 
            title: "Auto-Balance Failed",
            message: data.message || "Failed to auto-balance portfolio",
            timestamp: Date.now(),
            details: data.details
          }, ...prev.slice(0, 4)]);
        }

        if (data.type === "auto_balance_triggered") {
          setEvents(prev => [{
            id: `triggered_${Date.now()}`,
            type: "info",
            title: "Auto-Balance Triggered", 
            message: data.message || "Auto-balancing started",
            timestamp: Date.now(),
            details: data.details
          }, ...prev.slice(0, 4)]);
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "info":
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-800/20 border-green-500/30 text-green-300";
      case "error":
        return "bg-red-800/20 border-red-500/30 text-red-300";
      case "warning":
        return "bg-yellow-800/20 border-yellow-500/30 text-yellow-300";
      case "info":
        return "bg-blue-800/20 border-blue-500/30 text-blue-300";
      default:
        return "bg-gray-800/20 border-gray-500/30 text-gray-300";
    }
  };

  if (events.length === 0) {
    return (
      <div className={`trading-card p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Auto-Balance Status</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </div>
        <p className="text-gray-400 text-sm">
          {isConnected ? "Monitoring for auto-balance events..." : "Disconnected from bot"}
        </p>
      </div>
    );
  }

  return (
    <div className={`trading-card p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <DollarSign className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-white">Auto-Balance Status</h3>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
      </div>
      
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className={`p-3 rounded-lg border ${getStatusColor(event.type)}`}
          >
            <div className="flex items-start space-x-2">
              {getIcon(event.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <span className="text-xs opacity-70">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-90">{event.message}</p>
                {event.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer opacity-70">
                      View Details
                    </summary>
                    <pre className="text-xs mt-1 opacity-60 overflow-x-auto">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
