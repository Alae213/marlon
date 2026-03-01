import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";

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

    console.log("User webhook received:", { id, email, first_name, last_name, phone });
  }

  if (eventType === "user.deleted") {
    const { id } = msg.data;
    console.log("User deleted:", { id });
  }

  return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
}
