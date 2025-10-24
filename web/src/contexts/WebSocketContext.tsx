"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { WSMessage } from "@/types/bot";

interface WebSocketContextType {
  data: any;
  connected: boolean;
  error: string | null;
  send: (data: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
}

export function WebSocketProvider({ children, url }: WebSocketProviderProps) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnecting = useRef(false);

  const connect = useCallback(() => {
    if (isConnecting.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      isConnecting.current = true;

      // Only log connection attempts if we haven't exceeded max attempts
      if (reconnectAttempts.current < maxReconnectAttempts) {
        console.log("🔌 Connecting to WebSocket:", url);
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log("✅ WebSocket connected to:", url);
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        isConnecting.current = false;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          if (message.type === "error") {
            setError(message.data.message || "Unknown error");
            return;
          }

          setData(message.data);
          setError(null);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
          setError("Failed to parse message");
        }
      };

      wsRef.current.onerror = (event) => {
        // Only log errors for the first few attempts to reduce console noise
        if (reconnectAttempts.current < 3) {
          console.error("❌ WebSocket error for", url, ":", event);
        }
        setError("Connection error");
        setConnected(false);
        isConnecting.current = false;
      };

      wsRef.current.onclose = (event) => {
        // Only log disconnection for the first few attempts
        if (reconnectAttempts.current < 3) {
          console.log("🔌 WebSocket disconnected:", event.code, event.reason);
        }
        setConnected(false);
        isConnecting.current = false;

        // Attempt reconnection if not manually closed
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );

          // Only log reconnection attempts for the first few times
          if (reconnectAttempts.current < 3) {
            console.log(
              `🔄 Reconnecting in ${delay}ms (attempt ${
                reconnectAttempts.current + 1
              }/${maxReconnectAttempts})`
            );
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError("Max reconnection attempts reached");
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      setError("Failed to connect");
      isConnecting.current = false;
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setConnected(false);
    setData(null);
    isConnecting.current = false;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected");
      setError("Not connected");
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setError(null);
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const value: WebSocketContextType = {
    data,
    connected,
    error,
    send,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
