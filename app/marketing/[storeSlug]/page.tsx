"use client";

import { useParams } from "next/navigation";
import { Megaphone, Calendar, TrendingUp, Users, Target, Zap } from "lucide-react";
import { Card } from "@/components/core/card";
import { BottomNavigation } from "@/components/core/bottom-navigation";

export default function MarketingPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="headline-2xl text-[var(--system-600)] mb-2">
          Marketing
        </h1>
        <p className="body-base text-[var(--system-400)]">
          Marketing and promotion tools for your store - Coming Soon
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-[var(--system-100)] rounded-full flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-[var(--system-300)]" />
          </div>
          
          <div>
            <h2 className="title-xl text-[var(--system-600)] mb-2">
              Coming Soon
            </h2>
            <p className="body-base text-[var(--system-400)] mb-4">
              We are working on advanced marketing tools to help grow your store
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--system-100)] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-[var(--system-300)]" />
              </div>
              <h3 className="title-xl text-[var(--system-600)] mb-1">
                Advertising Campaigns
              </h3>
              <p className="label-xs text-[var(--system-400)]">
                Create and manage custom marketing campaigns
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--system-100)] rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-[var(--system-300)]" />
              </div>
              <h3 className="title-xl text-[var(--system-600)] mb-1">
                Analytics & Reports
              </h3>
              <p className="label-xs text-[var(--system-400)]">
                Track your marketing campaign performance
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--system-100)] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[var(--system-300)]" />
              </div>
              <h3 className="title-xl text-[var(--system-600)] mb-1">
                Email Marketing
              </h3>
              <p className="label-xs text-[var(--system-400)]">
                Communicate with your customers via email
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-8">
            <div className="flex items-center gap-2 label-xs text-[var(--system-400)]">
              <Zap className="w-4 h-4" />
              <span>Discount Coupons</span>
            </div>
            <div className="flex items-center gap-2 label-xs text-[var(--system-400)]">
              <Calendar className="w-4 h-4" />
              <span>Promotional Dates</span>
            </div>
            <div className="flex items-center gap-2 label-xs text-[var(--system-400)]">
              <TrendingUp className="w-4 h-4" />
              <span>Market Analysis</span>
            </div>
            <div className="flex items-center gap-2 label-xs text-[var(--system-400)]">
              <Users className="w-4 h-4" />
              <span>Customer Loyalty</span>
            </div>
          </div>
        </div>
      </Card>

      <BottomNavigation storeSlug={storeSlug} currentPage="marketing" />
    </div>
  );
}
