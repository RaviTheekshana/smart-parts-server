import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../_shared/aws.js";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const body = event.body ? JSON.parse(event.body) : {};
  const sku = body.sku;
  const qty = Number(body.qty || 0);
  if (!sku || qty <= 0) return json(400, { message: "sku and qty required" });

  const out = await ddb.send(new GetCommand({ TableName: process.env.CARTS_TABLE, Key: { userId: ctx.userId } }));
  const cart = out.Item || { userId: ctx.userId, items: [] };

  const items = Array.isArray(cart.items) ? cart.items : [];
  const idx = items.findIndex(i => i.sku === sku);
  if (idx >= 0) items[idx].qty = Number(items[idx].qty || 0) + qty;
  else items.push({ sku, qty });

  cart.items = items;
  cart.updatedAt = new Date().toISOString();

  await ddb.send(new PutCommand({ TableName: process.env.CARTS_TABLE, Item: cart }));
  return json(200, cart);
}
