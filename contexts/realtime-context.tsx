"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface RealtimeContextType {
  isConnected: boolean;
  lastUpdate: number | null;
  triggerUpdate: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastUpdate: null,
  triggerUpdate: () => {},
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: ReactNode;
  storeId?: string;
}

export function RealtimeProvider({ children, storeId }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const triggerUpdate = () => {
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    // In a real implementation, this would connect to Convex's realtime subscriptions
    // For now, we'll simulate the connection
    setIsConnected(true);

    // Poll for updates every 30 seconds as a fallback
    const pollInterval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      setIsConnected(false);
    };
  }, [storeId]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastUpdate, triggerUpdate }}>
      {children}
    </RealtimeContext.Provider>
  );
}
