import { NextRequest, NextResponse } from "next/server";

type SellingStage = "already_online" | "dm_orders" | "pre_launch" | "exploring";
type HeardFrom = "tiktok_instagram" | "youtube_podcasts" | "friend" | "events_linkedin";
type Bottleneck = "confirmation" | "customer_details" | "delivery_handoff" | "status_tracking";
type ExpectedDailyOrders = "0_5" | "6_20" | "21_50" | "50_plus";

type PreSignupAnswers = {
  sellingStage: SellingStage | null;
  heardFrom: HeardFrom[];
  bottlenecks: Bottleneck[];
  expectedDailyOrders: ExpectedDailyOrders | null;
};

type GoogleSheetPayload = {
  sessionId: string;
  completedAt: string;
  sellingStage: SellingStage | "";
  heardFrom: string;
  bottlenecks: string;
  expectedDailyOrders: ExpectedDailyOrders | "";
};

const SELLING_STAGE_VALUES = new Set<SellingStage>([
  "already_online",
  "dm_orders",
  "pre_launch",
  "exploring",
]);

const HEARD_FROM_VALUES = new Set<HeardFrom>([
  "tiktok_instagram",
  "youtube_podcasts",
  "friend",
  "events_linkedin",
]);

const BOTTLENECK_VALUES = new Set<Bottleneck>([
  "confirmation",
  "customer_details",
  "delivery_handoff",
  "status_tracking",
]);

const EXPECTED_DAILY_ORDERS_VALUES = new Set<ExpectedDailyOrders>([
  "0_5",
  "6_20",
  "21_50",
  "50_plus",
]);

const readString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") {
    throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
  }

  return trimmed;
};

const readOptionalEnum = <T extends string>(value: unknown, allowed: Set<T>) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !allowed.has(value as T)) {
    throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
  }

  return value as T;
};

const readEnumArray = <T extends string>(value: unknown, allowed: Set<T>, maxItems: number) => {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
  }

  const values = value.map((item) => {
    if (typeof item !== "string" || !allowed.has(item as T)) {
      throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
    }

    return item as T;
  });

  return Array.from(new Set(values));
};

const readAnswers = (value: unknown): PreSignupAnswers => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
  }

  const answers = value as Partial<Record<keyof PreSignupAnswers, unknown>>;

  return {
    sellingStage: readOptionalEnum(answers.sellingStage, SELLING_STAGE_VALUES),
    heardFrom: readEnumArray(answers.heardFrom, HEARD_FROM_VALUES, 4),
    bottlenecks: readEnumArray(answers.bottlenecks, BOTTLENECK_VALUES, 4),
    expectedDailyOrders: readOptionalEnum(answers.expectedDailyOrders, EXPECTED_DAILY_ORDERS_VALUES),
  };
};

const toGoogleSheetPayload = (
  sessionId: string,
  completedAt: number | undefined,
  answers: PreSignupAnswers
): GoogleSheetPayload => ({
  sessionId,
  completedAt: new Date(completedAt ?? Date.now()).toISOString(),
  sellingStage: answers.sellingStage ?? "",
  heardFrom: answers.heardFrom.join(","),
  bottlenecks: answers.bottlenecks.join(","),
  expectedDailyOrders: answers.expectedDailyOrders ?? "",
});

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.PRE_SIGNUP_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, configured: false, error: "Google Sheet webhook is not configured." },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD");
    }

    const payload = body as {
      sessionId?: unknown;
      answers?: unknown;
      completedAt?: unknown;
    };

    const sessionId = readString(payload.sessionId, 120);
    const completedAt =
      typeof payload.completedAt === "number" && Number.isFinite(payload.completedAt)
        ? payload.completedAt
        : undefined;

    const sheetPayload = toGoogleSheetPayload(
      sessionId,
      completedAt,
      readAnswers(payload.answers)
    );

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sheetPayload),
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Google Sheet webhook rejected the answers." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("PRE_SIGNUP_SHEET_MALFORMED_PAYLOAD") ? 400 : 500;

    return NextResponse.json(
      { success: false, error: "Unable to sync pre-signup answers." },
      { status }
    );
  }
}
