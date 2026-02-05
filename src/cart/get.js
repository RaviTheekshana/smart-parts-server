import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../_shared/aws.js";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const out = await ddb.send(new GetCommand({ TableName: process.env.CARTS_TABLE, Key: { userId: ctx.userId } }));
  if (!out.Item) {
    const empty = { userId: ctx.userId, items: [], updatedAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: process.env.CARTS_TABLE, Item: empty }));
    return json(200, empty);
  }
  return json(200, out.Item);
}
