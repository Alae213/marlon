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
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#fafafa] mb-2">
          التسويق
        </h1>
        <p className="text-[#737373]">
          أدوات التسويق والترويج لمتجرك - قريباً
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-[#f5f5f5] dark:bg-[#171717] rounded-full flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-[#a3a3a3]" />
          </div>
          
          <div>
            <h2 className="text-xl font-medium text-[#171717] dark:text-[#fafafa] mb-2">
              قريباً
            </h2>
            <p className="text-[#737373] mb-4">
              نعمل على تطوير أدوات تسويق متقدمة لمساعدتك في نمو متجرك
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#171717] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-[#a3a3a3]" />
              </div>
              <h3 className="font-medium text-[#171717] dark:text-[#fafafa] mb-1">
                الحملات الإعلانية
              </h3>
              <p className="text-sm text-[#737373]">
                إنشاء وإدارة حملات تسويقية مخصصة
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#171717] rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-[#a3a3a3]" />
              </div>
              <h3 className="font-medium text-[#171717] dark:text-[#fafafa] mb-1">
                التحليلات والتقارير
              </h3>
              <p className="text-sm text-[#737373]">
                تتبع أداء حملاتك التسويقية
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#171717] rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[#a3a3a3]" />
              </div>
              <h3 className="font-medium text-[#171717] dark:text-[#fafafa] mb-1">
                التسويق عبر البريد
              </h3>
              <p className="text-sm text-[#737373]">
                التواصل مع عملائك عبر البريد الإلكتروني
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-8">
            <div className="flex items-center gap-2 text-sm text-[#737373]">
              <Zap className="w-4 h-4" />
              <span>كوبونات الخصم</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#737373]">
              <Calendar className="w-4 h-4" />
              <span>المواعيد الترويجية</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#737373]">
              <TrendingUp className="w-4 h-4" />
              <span>تحليل السوق</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#737373]">
              <Users className="w-4 h-4" />
              <span>ولاء العملاء</span>
            </div>
          </div>
        </div>
      </Card>

      <BottomNavigation storeSlug={storeSlug} currentPage="marketing" />
    </div>
  );
}
