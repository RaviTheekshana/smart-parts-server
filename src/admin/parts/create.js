import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json } from "../../_shared/aws.js";
import { v4 as uuidv4 } from "uuid";

export async function handler(event) {
  const body = event.body ? JSON.parse(event.body) : {};

  const sku = String(body.sku || "").trim();
  const name = String(body.name || "").trim();
  const price = Number(body.price || 0);

  if (!sku || !name || price <= 0) {
    return json(400, { message: "sku, name, price required" });
  }

  const brandRaw = body.brand !== undefined && body.brand !== null ? String(body.brand).trim() : "";
  const brand = brandRaw || null; // store null if empty

  const partId = uuidv4();
  const now = new Date().toISOString();

  const item = {
    partId,
    sku,
    name,
    brand, // ✅ FIX HERE
    price,
    description: body.description ?? null,
    category: body.category ?? null,
    images: Array.isArray(body.images) ? body.images : [],
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(new PutCommand({ TableName: process.env.PARTS_TABLE, Item: item }));
  return json(201, { ...item, id: partId });
}
