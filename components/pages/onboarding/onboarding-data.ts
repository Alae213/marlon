"use client";

import {
  Calendar,
  Camera,
  ClipboardCheck,
  Layers,
  MessageCircle,
  Package,
  PackageOpen,
  Phone,
  Rocket,
  Search,
  ShoppingBag,
  TrendingUp,
  Truck,
  TvMinimalPlay,
  User,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export type SellingStage = "already_online" | "dm_orders" | "pre_launch" | "exploring";
export type HeardFrom = "tiktok_instagram" | "youtube_podcasts" | "friend" | "events_linkedin";
export type Bottleneck = "confirmation" | "customer_details" | "delivery_handoff" | "status_tracking";
export type ExpectedDailyOrders = "0_5" | "6_20" | "21_50" | "50_plus";

export type PreSignupAnswers = {
  sellingStage: SellingStage | null;
  heardFrom: HeardFrom[];
  bottlenecks: Bottleneck[];
  expectedDailyOrders: ExpectedDailyOrders | null;
};

export type QuestionId = keyof PreSignupAnswers;
export type PreSignupOptionValue =
  | SellingStage
  | HeardFrom
  | Bottleneck
  | ExpectedDailyOrders;

export type PreSignupQuestion = {
  id: QuestionId;
  title: string;
  multiple: boolean;
  options: Array<{
    label: string;
    value: PreSignupOptionValue;
  }>;
};

export type StoredPreSignupState = {
  sessionId: string;
  step: number;
  completed: boolean;
  completedAt?: number;
  sheetSyncedAt?: number;
  answers: PreSignupAnswers;
  expiresAt: number;
};

export const PRE_SIGNUP_STORAGE_KEY = "marlon-pre-signup";
export const PRE_SIGNUP_STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const PRE_SIGNUP_EXIT_URL = "https://marlon.framer.ai/";

export const emptyPreSignupAnswers: PreSignupAnswers = {
  sellingStage: null,
  heardFrom: [],
  bottlenecks: [],
  expectedDailyOrders: null,
};

export const preSignupQuestions: PreSignupQuestion[] = [
  {
    id: "sellingStage",
    title: "Where are you with selling right now? 🛍️",
    multiple: false,
    options: [
      { label: "I already sell online", value: "already_online" },
      { label: "I take orders in DMs", value: "dm_orders" },
      { label: "I'm preparing to launch", value: "pre_launch" },
      { label: "Just exploring for now", value: "exploring" },
    ],
  },
  {
    id: "heardFrom",
    title: "So, where did you hear about me? 👀",
    multiple: true,
    options: [
      { label: "TikTok / Instagram Reels", value: "tiktok_instagram" },
      { label: "YouTube / Podcasts", value: "youtube_podcasts" },
      { label: "A friend told me", value: "friend" },
      { label: "Events / LinkedIn", value: "events_linkedin" },
    ],
  },
  {
    id: "bottlenecks",
    title: 'What gets messy after someone says "I want it"? 😅',
    multiple: true,
    options: [
      { label: "Confirming the order", value: "confirmation" },
      { label: "Getting phone + address details", value: "customer_details" },
      { label: "Sending it to delivery", value: "delivery_handoff" },
      { label: "Tracking who paid / delivered / cancelled", value: "status_tracking" },
    ],
  },
  {
    id: "expectedDailyOrders",
    title: "On a good day, how many COD orders could you get? 📦",
    multiple: false,
    options: [
      { label: "0-5", value: "0_5" },
      { label: "6-20", value: "6_20" },
      { label: "21-50", value: "21_50" },
      { label: "50+", value: "50_plus" },
    ],
  },
];

export const preSignupOptionIcons: Record<PreSignupOptionValue, LucideIcon> = {
  already_online: ShoppingBag,
  dm_orders: MessageCircle,
  pre_launch: Rocket,
  exploring: Search,
  tiktok_instagram: Camera,
  youtube_podcasts: TvMinimalPlay,
  friend: User,
  events_linkedin: Calendar,
  confirmation: Phone,
  customer_details: MapPin,
  delivery_handoff: Truck,
  status_tracking: ClipboardCheck,
  "0_5": Package,
  "6_20": PackageOpen,
  "21_50": Layers,
  "50_plus": TrendingUp,
};

export const getSelectedValues = (
  answers: PreSignupAnswers,
  question: PreSignupQuestion
): PreSignupOptionValue[] => {
  switch (question.id) {
    case "sellingStage":
      return answers.sellingStage ? [answers.sellingStage] : [];
    case "heardFrom":
      return answers.heardFrom;
    case "bottlenecks":
      return answers.bottlenecks;
    case "expectedDailyOrders":
      return answers.expectedDailyOrders ? [answers.expectedDailyOrders] : [];
  }
};
