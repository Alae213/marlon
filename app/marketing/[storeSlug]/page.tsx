"use client";

import { useParams } from "next/navigation";
import { Megaphone, Calendar, TrendingUp, Users, Target, Zap, Sparkles } from "lucide-react";
import { BottomNavigation } from "@/components/core/bottom-navigation";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export default function MarketingPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;

  const previewFeatures = [
    {
      icon: Target,
      title: "Smart Ads",
      description: "Automated campaign management across social platforms.",
      color: "text-blue-400",
    },
    {
      icon: TrendingUp,
      title: "Growth Analytics",
      description: "Deep insights into customer behavior and conversion rates.",
      color: "text-emerald-400",
    },
    {
      icon: Users,
      title: "Customer CRM",
      description: "Direct email and SMS marketing for repeat business.",
      color: "text-amber-400",
    },
  ];

  const badges = [
    { icon: Zap, label: "Discount Engine" },
    { icon: Calendar, label: "Flash Sales" },
    { icon: Megaphone, label: "Push Alerts" },
    { icon: Sparkles, label: "AI Copywriter" },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl text-center space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="label-xs text-[var(--system-400)] font-medium uppercase tracking-wider">
              Under Development
            </span>
          </div>
          <h1 className="display-5xl text-[var(--system-700)] dark:text-white tracking-tight">
            Marketing <span className="text-[var(--system-300)]">&</span> Growth
          </h1>
          <p className="body-base text-[var(--system-400)] max-w-xl mx-auto">
            We are building a powerful suite of tools to help you reach more customers and scale your Algerian COD business effortlessly.
          </p>
        </motion.div>

        {/* Hero Preview Card */}
        <motion.div
          variants={itemVariants}
          className="relative group"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div 
            className="relative overflow-hidden bg-[image:var(--gradient-popup)] [corner-shape:squircle] rounded-[48px] p-8 md:p-12 backdrop-blur-[12px]"
            style={{ boxShadow: "var(--shadow-xl-shadow)" }}
          >
            {/* Abstract Background Decor */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {previewFeatures.map((feature, idx) => (
                <div key={idx} className="flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="title-xl text-white">{feature.title}</h3>
                    <p className="label-xs text-white/50 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Secondary Badges */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-3"
        >
          {badges.map((badge, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-default"
            >
              <badge.icon className="w-4 h-4 text-[var(--system-300)]" />
              <span className="label-xs text-[var(--system-400)]">{badge.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Placeholder */}
        <motion.div variants={itemVariants} className="pt-4">
          <p className="label-xs text-[var(--system-300)] italic">
            Launching for all sellers in Q2 2026. Stay tuned for early access.
          </p>
        </motion.div>
      </motion.div>

      <BottomNavigation storeSlug={storeSlug} currentPage="marketing" />
    </div>
  );
}
