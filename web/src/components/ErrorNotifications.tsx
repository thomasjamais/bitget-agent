"use client";

import { useEffect } from "react";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";

export function ErrorNotifications() {
  const { notifications, removeNotification } = useNotificationContext();

  useEffect(() => {
    // Listen for WebSocket messages with error notifications
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === "transfer_error" ||
          data.type === "transfer_success"
        ) {
          // These will be handled by the context
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    // Listen for WebSocket connection
    const ws = new WebSocket("ws://localhost:8081/ws");
    ws.onmessage = handleMessage;

    return () => {
      ws.close();
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-900/20 border-red-500/30";
      case "success":
        return "bg-green-900/20 border-green-500/30";
      case "warning":
        return "bg-yellow-900/20 border-yellow-500/30";
      case "info":
        return "bg-blue-900/20 border-blue-500/30";
      default:
        return "bg-gray-900/20 border-gray-500/30";
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border ${getBgColor(
            notification.type
          )} backdrop-blur-sm animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-300 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
