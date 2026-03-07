"use client";

import { ReactNode, useRef, useEffect, useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AnimatedTabs({ 
  tabs, 
  activeTab, 
  onChange,
  variant = "pills",
  size = "md",
  className = ""
}: AnimatedTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  useEffect(() => {
    if (variant !== "pills" || !containerRef.current) return;
    
    const container = containerRef.current;
    const buttons = container.querySelectorAll("button");
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    if (activeIndex >= 0 && buttons[activeIndex]) {
      const activeButton = buttons[activeIndex] as HTMLButtonElement;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left + 4,
        width: buttonRect.width - 8
      });
    }
  }, [activeTab, tabs, variant]);
  
  const baseClasses = "relative flex gap-1";
  
  const variantClasses = {
    default: "bg-muted p-0.5 rounded-lg",
    pills: "bg-[#f5f5f5] dark:bg-[#262626] p-1 rounded-lg",
    underline: "border-b border-[#e5e5e5] dark:border-[#404040]"
  };
  
  const sizeClasses = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5"
  };
  
  const inactiveClasses = {
    default: "text-muted-foreground hover:text-foreground",
    pills: "text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]",
    underline: "text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa] border-b-2 border-transparent hover:border-[#e5e5e5] dark:hover:border-[#404040]"
  };
  
  const activeClasses = {
    default: "bg-card text-foreground shadow-sm",
    pills: "bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] shadow-sm",
    underline: "text-[#171717] dark:text-[#fafafa] border-b-2 border-[#171717] dark:border-[#fafafa]"
  };

  return (
    <div ref={containerRef} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {variant === "pills" && (
        <div
          className="absolute top-1 bottom-1 bg-white dark:bg-[#171717] rounded-md shadow-sm transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      )}
      
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative z-10 flex items-center justify-center gap-2 font-medium transition-colors flex-1
            ${sizeClasses[size]}
            ${activeTab === tab.id 
              ? activeClasses[variant] 
              : inactiveClasses[variant]
            }
          `}
        >
          {tab.icon}
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
