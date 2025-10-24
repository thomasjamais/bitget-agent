"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface AllocationNotification {
  id: string;
  type: "allocation_error" | "allocation_warning" | "allocation_critical_error";
  message: string;
  symbol?: string;
  amount?: number;
  timestamp: number;
}

export function AllocationNotifications() {
  const [notifications, setNotifications] = useState<AllocationNotification[]>(
    []
  );
  const { data } = useWebSocket("ws://localhost:8081/ws");

  useEffect(() => {
    if (
      data &&
      (data.type === "allocation_error" ||
        data.type === "allocation_warning" ||
        data.type === "allocation_critical_error")
    ) {
      const notification: AllocationNotification = {
        id: Math.random().toString(36).substr(2, 9),
        type: data.type,
        message: data.error || data.message,
        symbol: data.symbol,
        amount: data.amount,
        timestamp: data.timestamp || Date.now(),
      };

      setNotifications((prev) => [notification, ...prev.slice(0, 4)]); // Keep only last 5 notifications

      // Auto-remove after 10 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      }, 10000);
    }
  }, [data]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border shadow-lg transition-all duration-300 ${
            notification.type === "allocation_critical_error"
              ? "bg-red-50 border-red-200 text-red-800"
              : notification.type === "allocation_error"
              ? "bg-orange-50 border-orange-200 text-orange-800"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium">
                  {notification.type === "allocation_critical_error"
                    ? "🚨 Critical Error"
                    : notification.type === "allocation_error"
                    ? "⚠️ Allocation Error"
                    : "💡 Warning"}
                </span>
                {notification.symbol && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                    {notification.symbol}
                  </span>
                )}
              </div>
              <p className="text-sm">{notification.message}</p>
              {notification.amount && (
                <p className="text-xs mt-1 opacity-75">
                  Amount: ${notification.amount} USDT
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
