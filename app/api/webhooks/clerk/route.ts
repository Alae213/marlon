import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
}
const convex = new ConvexHttpClient(convexUrl);

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  const payload = await req.json();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const wh = new Webhook(webhookSecret);
  let msg: WebhookEvent;

  try {
    msg = wh.verify(payload, headers) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const eventType = msg.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, phone_numbers } = msg.data;
    const email = email_addresses?.[0]?.email_address;
    const phone = phone_numbers?.[0]?.phone_number;

    if (id && email) {
      await convex.mutation(api.users.syncUser, {
        clerkId: id,
        email,
        firstName: first_name || undefined,
        lastName: last_name || undefined,
        phone: phone || undefined,
      });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = msg.data;
    if (id) {
      await convex.mutation(api.users.deleteUser, {
        clerkId: id,
      });
    }
  }

  return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
}
