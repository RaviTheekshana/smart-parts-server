import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, getUserContext } from "../_shared/aws.js";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return { statusCode: 401, body: "Unauthorized" };

  const empty = { userId: ctx.userId, items: [], updatedAt: new Date().toISOString() };
  await ddb.send(new PutCommand({ TableName: process.env.CARTS_TABLE, Item: empty }));
  return { statusCode: 204, body: "" };
}
