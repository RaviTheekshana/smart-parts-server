import Stripe from "stripe";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../_shared/aws.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const body = event.body ? JSON.parse(event.body) : {};
  const orderId = body.orderId;
  if (!orderId) return json(400, { message: "orderId required" });

  // Load order (to calculate amount + items)
  const out = await ddb.send(
    new GetCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
    })
  );

  const order = out.Item;
  if (!order) return json(404, { message: "Order not found" });
  if (order.userId !== ctx.userId && !ctx.isAdmin) return json(403, { message: "Forbidden" });

  // Minimal line items for Stripe (use your order items)
  // NOTE: Stripe amount is in cents. LKR uses smallest currency unit.
  // We'll use a simple approach: one “Order Payment” line item with total.
  const amount = Number(body.amount || 0); // pass totals.grand from frontend
  if (!amount || amount <= 0) return json(400, { message: "amount required" });

  const successUrl =
    `${process.env.FRONTEND_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${encodeURIComponent(orderId)}`;
  const cancelUrl =
    `${process.env.FRONTEND_BASE_URL}/checkout/cancel?orderId=${encodeURIComponent(orderId)}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: ctx.email || undefined,
    metadata: { orderId },
    line_items: [
      {
        price_data: {
          currency: "lkr",
          product_data: { name: `SmartParts Order ${orderId}` },
          unit_amount: Math.round(amount), // LKR smallest unit (no decimals typically)
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  // Save session id to order (optional, but helpful)
  await ddb.send(
    new UpdateCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: "SET stripeSessionId = :sid, updatedAt = :t",
      ExpressionAttributeValues: { ":sid": session.id, ":t": new Date().toISOString() },
    })
  );

  return json(200, { url: session.url, sessionId: session.id });
}
