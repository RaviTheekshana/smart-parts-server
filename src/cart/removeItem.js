import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../_shared/aws.js";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const sku = event?.pathParameters?.sku;
  if (!sku) return json(400, { message: "Missing sku" });

  const out = await ddb.send(new GetCommand({ TableName: process.env.CARTS_TABLE, Key: { userId: ctx.userId } }));
  const cart = out.Item || { userId: ctx.userId, items: [] };
  cart.items = (cart.items || []).filter(i => i.sku !== sku);
  cart.updatedAt = new Date().toISOString();
  await ddb.send(new PutCommand({ TableName: process.env.CARTS_TABLE, Item: cart }));
  return { statusCode: 204, body: "" };
}
