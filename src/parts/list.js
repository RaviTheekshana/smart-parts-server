import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json } from "../_shared/aws.js";

export async function handler() {
  const out = await ddb.send(new ScanCommand({ TableName: process.env.PARTS_TABLE, Limit: 200 }));
  const items = (out.Items || []).map(p => ({ ...p, id: p.partId }));
  return json(200, items);
}
