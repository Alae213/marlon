"use client";

import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/primitives/ui/switch";
import { useTheme } from "@/lib/theme/provider";

export function PreferencesSettings() {
  const { theme, isLoading, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-2">Appearance</h3>
        <p className="text-sm text-[#737373] mb-4">
          Choose your preferred theme. Your preference will be saved automatically.
        </p>

        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 border border-[#e5e5e5] dark:border-[#262626] rounded-xl bg-white dark:bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-blue-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            <Switch
              label={theme === "dark" ? "Dark" : "Light"}
              checked={theme === "dark"}
              onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
              disabled={isLoading}
            />
          </div>

          {/* Theme Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-5 border-2 rounded-xl transition-all ${
                theme === "light"
                  ? "border-[#171717] bg-white shadow-sm"
                  : "border-[#e5e5e5] bg-white/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-[#171717]">Light</span>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 bg-[#e5e5e5] rounded"></div>
                <div className="h-2.5 bg-[#e5e5e5] rounded w-3/4"></div>
                <div className="h-2.5 bg-[#e5e5e5] rounded w-1/2"></div>
              </div>
            </div>

            <div
              className={`p-5 border-2 rounded-xl transition-all ${
                theme === "dark"
                  ? "border-[#fafafa] bg-[#0a0a0a] shadow-sm"
                  : "border-[#262626] bg-[#0a0a0a]/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-[#fafafa]">Dark</span>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 bg-[#262626] rounded"></div>
                <div className="h-2.5 bg-[#262626] rounded w-3/4"></div>
                <div className="h-2.5 bg-[#262626] rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#f5f5f5] dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
        <p className="text-sm text-[#737373]">
          <span className="inline-flex items-center justify-center w-5 h-5 bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] rounded-full text-xs font-bold mr-2">
            i
          </span>
          Theme preferences are saved automatically and will be applied on your next visit.
        </p>
      </div>
    </div>
  );
}
