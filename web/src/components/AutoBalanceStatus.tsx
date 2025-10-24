"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";

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
  const { connected, data } = useWebSocket();

  useEffect(() => {
    if (data && typeof data === "object" && data !== null) {
      // Listen for auto-balance events in the WebSocket data
      const botData = data as any;

      // Check if this data contains auto-balance events
      if (botData.autoBalanceEvents) {
        setEvents(botData.autoBalanceEvents);
      }
    }
  }, [data]);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const EventCard = ({ event }: { event: AutoBalanceEvent }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-start space-x-3">
        {getIcon(event.type)}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-primary text-sm">
              {event.title}
            </h4>
            <span className="text-xs text-muted">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-secondary mb-3">{event.message}</p>
          {event.details && (
            <details className="group">
              <summary className="text-xs cursor-pointer text-accent hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                View Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-muted overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );

  if (events.length === 0) {
    return (
      <div className={`metric-card ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Auto-Balance Status
            </h2>
            <p className="text-muted">Portfolio rebalancing automation</p>
          </div>
        </div>

        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {connected ? (
              <Wifi className="w-6 h-6 text-green-500" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-500" />
            )}
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
          </div>
          <div className="text-muted text-lg font-medium">
            {connected
              ? "Monitoring Auto-Balance Events"
              : "Disconnected from Bot"}
          </div>
          <div className="text-muted text-sm mt-1">
            {connected
              ? "Waiting for portfolio rebalancing activity..."
              : "Reconnect to monitor auto-balance status"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">
            Auto-Balance Status
          </h2>
          <p className="text-muted">Portfolio rebalancing automation</p>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          {connected ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          ></div>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
