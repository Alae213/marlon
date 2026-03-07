"use client";

import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function AnimatedTabs({ 
  tabs, 
  activeTab, 
  onChange,
  className = ""
}: AnimatedTabsProps) {
  return (
    <div className={`relative flex gap-0 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center justify-center gap-0 body-base transition-colors
            px-[10px] py-[6px] rounded-[12px] gap-[6px]
            ${activeTab === tab.id 
              ? "bg-[var(--system-100)] text-[var(--system-600)]" 
              : "text-[var(--system-300)] hover:bg-[var(--system-100)] cursor-pointer"
            }
          `}
        >
          <span className={`${activeTab === tab.id ? "text-[var(--system-600)]" : "text-[var(--system-300)]"}`}>
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

interface AnimatedTabContentProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function AnimatedTabContent({ 
  children, 
  active = true,
  className = "" 
}: AnimatedTabContentProps) {
  // Simple conditional rendering - no animation to avoid layout issues
  if (!active) return null;
  
  return (
    <div className={className}>
      {children}
    </div>
  );
}
