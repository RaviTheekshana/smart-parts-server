import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json } from "../_shared/aws.js";

export async function handler(event) {
  const sku = event?.pathParameters?.sku;
  if (!sku) return json(400, { message: "Missing sku" });

  const out = await ddb.send(new GetCommand({ TableName: process.env.INVENTORY_TABLE, Key: { sku } }));
  if (!out.Item) return json(404, { message: "Not found" });
  return json(200, out.Item);
}
