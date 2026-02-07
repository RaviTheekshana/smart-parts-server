import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const out = await ddb.send(new ScanCommand({ TableName: process.env.VEHICLES_TABLE }));
  const vehicles = out.Items || [];

  vehicles.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  return json(200, { vehicles, total: vehicles.length });
}
