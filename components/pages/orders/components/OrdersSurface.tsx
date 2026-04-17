"use client";

import type { ComponentProps } from "react";
import { KanbanView, ListView } from "@/components/pages/orders/views";
import { OrdersLoadingPanel } from "./OrdersLoadingPanel";

type ListViewSurfaceProps = Omit<
  ComponentProps<typeof ListView>,
  "viewMode" | "onViewModeChange" | "isStateViewEnabled"
>;

interface OrdersSurfaceProps {
  isOrdersLoading: boolean;
  viewMode: "list" | "state";
  onViewModeChange: (mode: "list" | "state") => void;
  isStateViewEnabled: boolean;
  listViewProps: ListViewSurfaceProps;
}

export function OrdersSurface({
  isOrdersLoading,
  viewMode,
  onViewModeChange,
  isStateViewEnabled,
  listViewProps,
}: OrdersSurfaceProps) {
  if (isOrdersLoading) {
    return <OrdersLoadingPanel />;
  }

  if (viewMode === "state" && isStateViewEnabled) {
    return (
      <KanbanView
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        isStateViewEnabled={isStateViewEnabled}
      />
    );
  }

  return (
    <ListView
      {...listViewProps}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      isStateViewEnabled={isStateViewEnabled}
    />
  );
}
