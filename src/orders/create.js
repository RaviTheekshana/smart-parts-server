import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext, putEvent } from "../_shared/aws.js";
import { v4 as uuidv4 } from "uuid";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const body = event.body ? JSON.parse(event.body) : {};
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return json(400, { message: "items required" });

  const orderId = uuidv4();
  const now = new Date().toISOString();
  const order = {
    orderId,
    userId: ctx.userId,
    items: items.map(i => ({ sku: i.sku, qty: Number(i.qty || 0) })).filter(i => i.sku && i.qty > 0),
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(new PutCommand({ TableName: process.env.ORDERS_TABLE, Item: order }));

  await putEvent({
    source: "smartparts.orders",
    detailType: "OrderCreated",
    detail: { orderId, userId: ctx.userId, items: order.items }
  });

  return json(201, order);
}
