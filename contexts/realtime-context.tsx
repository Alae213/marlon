"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface RealtimeContextType {
  isConnected: boolean;
  lastUpdate: number | null;
  triggerUpdate: () => void;
  newOrdersCount: number;
  newNotifications: any[];
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastUpdate: null,
  triggerUpdate: () => {},
  newOrdersCount: 0,
  newNotifications: [],
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: ReactNode;
  storeId?: string;
  userId?: string;
}

export function RealtimeProvider({ children, storeId, userId }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [newNotifications, setNewNotifications] = useState<any[]>([]);

  // Subscribe to real-time updates for orders if storeId is provided
  const realtimeOrders = useQuery(
    api.orders.subscribeToStoreOrders,
    storeId ? { storeId: storeId as any } : "skip"
  );

  // Subscribe to dashboard updates (all stores for dashboard)
  const dashboardUpdates = useQuery(
    api.stores.subscribeToUserStores,
    userId ? { userId } : "skip"
  );

  const triggerUpdate = () => {
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    // Check if we have active subscriptions
    const hasActiveSubscriptions = !!realtimeOrders || !!dashboardUpdates;
    setIsConnected(hasActiveSubscriptions);

    if (hasActiveSubscriptions) {
      setLastUpdate(Date.now());
    }
  }, [realtimeOrders, dashboardUpdates]);

  // Count new orders for notifications
  const newOrdersCount = realtimeOrders?.filter((order: any) => 
    order.status === "new" && 
    order.createdAt > (lastUpdate || 0)
  ).length || 0;

  // Update notifications when new data comes in
  useEffect(() => {
    if (realtimeOrders && lastUpdate) {
      const newOrders = realtimeOrders.filter((order: any) => 
        order.createdAt > lastUpdate
      );
      
      if (newOrders.length > 0) {
        setNewNotifications(prev => [
          ...prev,
          ...newOrders.map((order: any) => ({
            id: order.id,
            type: "new_order",
            message: `طلب جديد: ${order.orderNumber}`,
            timestamp: order.createdAt,
            data: order
          }))
        ]);
      }
    }
  }, [realtimeOrders, lastUpdate]);

  return (
    <RealtimeContext.Provider value={{ 
      isConnected, 
      lastUpdate, 
      triggerUpdate, 
      newOrdersCount,
      newNotifications 
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}
