"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";

interface Notification {
  id: string;
  type: "new_order";
  message: string;
  timestamp: number;
  data: Doc<"orders">;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastUpdate: number | null;
  triggerUpdate: () => void;
  newOrdersCount: number;
  newNotifications: Notification[];
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
  storeId?: Id<"stores">;
  userId?: Id<"users">;
}

export function RealtimeProvider({ children, storeId, userId }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);

  // Subscribe to real-time updates for orders if storeId is provided
  const realtimeOrders = useQuery(
    api.orders.subscribeToStoreOrders,
    storeId ? { storeId } : "skip"
  );

  // Subscribe to dashboard updates (all stores for dashboard)
  const dashboardUpdates = useQuery(
    api.stores.subscribeToUserStores,
    userId ? { userId } : "skip"
  );

const triggerUpdate = () => {
    setLastUpdate(Date.now());
  };

  const hasConnection = !!realtimeOrders || !!dashboardUpdates;

  // Count new orders for notifications
  const newOrdersCount = realtimeOrders?.filter((order: Doc<"orders">) => 
    order.status === "new" && 
    order.createdAt > (lastUpdate || 0)
  ).length || 0;

  // Calculate notifications from new orders
  const notificationsFromNewOrders = useMemo(() => {
    if (!realtimeOrders || !lastUpdate) return [];
    
    const newOrders = realtimeOrders.filter((order: Doc<"orders">) => 
      order.createdAt > lastUpdate
    );
    
    return newOrders.map((order: Doc<"orders">) => ({
      id: order._id.toString(),
      type: "new_order" as const,
      message: `طلب جديد: ${order.orderNumber}`,
      timestamp: order.createdAt,
      data: order
    }));
  }, [realtimeOrders, lastUpdate]);

  // Update notifications when new data comes in
  useEffect(() => {
    if (notificationsFromNewOrders.length > 0) {
      setNewNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifications = notificationsFromNewOrders.filter(n => !existingIds.has(n.id));
        return [...prev, ...newNotifications];
      });
    }
  }, [notificationsFromNewOrders]);

  // Update connection state
  useEffect(() => {
    if (hasConnection) {
      setLastUpdate(Date.now());
    }

    setIsConnected(hasConnection);
  }, [hasConnection]);

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
