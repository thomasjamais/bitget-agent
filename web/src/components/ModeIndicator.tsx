"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

export function ModeIndicator() {
  const [isTestnet, setIsTestnet] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [uptime, setUptime] = useState<string>("--:--:--");

  const { data, connected } = useWebSocket("ws://localhost:8080/ws");

  useEffect(() => {
    setIsConnected(connected);
    if (data && typeof data === "object" && data !== null) {
      // Try to extract testnet info from various possible data structures
      const botData = data as {
        config?: { api?: { useTestnet?: boolean } };
        api?: { useTestnet?: boolean };
        useTestnet?: boolean;
        environment?: string;
        uptime?: number;
      };

      if (typeof botData.config?.api?.useTestnet === "boolean") {
        setIsTestnet(botData.config.api.useTestnet);
      } else if (typeof botData.api?.useTestnet === "boolean") {
        setIsTestnet(botData.api.useTestnet);
      } else if (typeof botData.useTestnet === "boolean") {
        setIsTestnet(botData.useTestnet);
      } else if (botData.environment === "TESTNET") {
        setIsTestnet(true);
      } else if (botData.environment === "LIVE") {
        setIsTestnet(false);
      }

      // Extract uptime
      if (typeof botData.uptime === "number") {
        const hours = Math.floor(botData.uptime / 3600);
        const minutes = Math.floor((botData.uptime % 3600) / 60);
        const seconds = botData.uptime % 60;
        setUptime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }
  }, [data, connected]);

  const mode = isTestnet ? "playground" : "production";
  const modeColor = isTestnet ? "bg-yellow-500" : "bg-red-500";
  const modeIcon = isTestnet ? "🧪" : "🔥";
  const modeBorder = isTestnet ? "border-yellow-500" : "border-red-500";
  const statusColor = isConnected ? "text-green-400" : "text-red-400";
  const statusIcon = isConnected ? "✅" : "❌";

  return (
    <div
      className={`border-2 ${modeBorder} rounded-lg p-3 ${
        isTestnet ? "bg-yellow-900/20" : "bg-red-900/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 ${modeColor} rounded-full ${
              isConnected ? "animate-pulse" : ""
            }`}
          ></div>
          <span className="text-xs font-bold text-white">
            {modeIcon} {mode.toUpperCase()}
          </span>
        </div>
        <div className={`text-xs ${statusColor} font-medium`}>
          {statusIcon} {isConnected ? "Live" : "Offline"}
        </div>
      </div>

      <div className="text-xs text-gray-300 space-y-1">
        <div className="flex justify-between">
          <span>Uptime:</span>
          <span className="font-mono">{uptime}</span>
        </div>
        <div className="text-xs text-gray-400">
          {isTestnet ? "Safe simulation mode" : "⚠️ Real money trading"}
        </div>
      </div>
    </div>
  );
}
