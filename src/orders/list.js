import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../_shared/aws.js";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const out = await ddb.send(new QueryCommand({
    TableName: process.env.ORDERS_TABLE,
    IndexName: "byUser",
    KeyConditionExpression: "userId = :u",
    ExpressionAttributeValues: { ":u": ctx.userId },
    ScanIndexForward: false,
    Limit: 50
  }));

  return json(200, out.Items || []);
}
