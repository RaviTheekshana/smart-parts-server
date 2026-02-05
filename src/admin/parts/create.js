import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";
import { v4 as uuidv4 } from "uuid";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });
  if (!ctx.isAdmin) return json(403, { message: "Forbidden" });

  const body = event.body ? JSON.parse(event.body) : {};
  const sku = body.sku;
  const name = body.name;
  const price = Number(body.price || 0);
  if (!sku || !name || price <= 0) return json(400, { message: "sku, name, price required" });

  const partId = uuidv4();
  const now = new Date().toISOString();
  const item = {
    partId,
    sku,
    name,
    price,
    description: body.description || null,
    category: body.category || null,
    images: Array.isArray(body.images) ? body.images : [],
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(new PutCommand({ TableName: process.env.PARTS_TABLE, Item: item }));
  return json(201, { ...item, id: partId });
}
