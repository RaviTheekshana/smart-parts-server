import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext, putEvent } from "../_shared/aws.js";
import { v4 as uuidv4 } from "uuid";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const body = event.body ? JSON.parse(event.body) : {};
  const orderId = body.orderId;
  const amount = Number(body.amount || 0);
  if (!orderId || amount <= 0) return json(400, { message: "orderId and amount required" });

  // For coursework, we simulate success.
  const paymentId = uuidv4();
  const payment = { paymentId, orderId, userId: ctx.userId, amount, status: "SUCCEEDED", createdAt: new Date().toISOString() };

  // store in Orders table as attribute, or you can create a Payments table; keeping simple by using Orders table only.
  // We'll store in Orders table indirectly via events; but also keep a record in PostsTable? no - skip.
  // Instead, use USERS_TABLE? no.
  // We'll just emit event + return.

  await putEvent({
    source: "smartparts.payments",
    detailType: "PaymentSucceeded",
    detail: { orderId, paymentId, amount }
  });

  return json(200, payment);
}
