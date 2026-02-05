import Stripe from "stripe";
import { json, getUserContext, putEvent } from "../_shared/aws.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const body = event.body ? JSON.parse(event.body) : {};
  const sessionId = body.sessionId;
  const orderId = body.orderId;

  if (!sessionId || !orderId) {
    return json(400, { message: "sessionId and orderId required" });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return json(400, { message: "Payment not completed", payment_status: session.payment_status });
  }

  // Emit event (your existing order onPaymentSucceeded handler will mark PAID)
  await putEvent({
    source: "smartparts.payments",
    detailType: "PaymentSucceeded",
    detail: {
      orderId,
      paymentId: session.payment_intent || session.id,
      amount: session.amount_total ?? null,
    },
  });

  return json(200, { ok: true });
}
