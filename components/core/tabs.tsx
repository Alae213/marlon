"use client";

import { ReactNode } from "react";

interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-[#f5f5f5] dark:bg-[#171717] p-0.5 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-2 font-medium transition-all ${
            activeTab === tab.id
              ? "bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa]"
              : "text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
