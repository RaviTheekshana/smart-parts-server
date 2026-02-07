import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const out = await ddb.send(new ScanCommand({ TableName: process.env.INVENTORY_TABLE }));
  const items = out.Items || [];

  items.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  return json(200, { inventory: items, total: items.length });
}
