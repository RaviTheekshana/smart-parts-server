import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../_shared/aws.js";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });

  const out = await ddb.send(new GetCommand({ TableName: process.env.USERS_TABLE, Key: { userId: ctx.userId } }));
  if (!out.Item) {
    const item = {
      userId: ctx.userId,
      email: ctx.email || null,
      role: ctx.isAdmin ? "admin" : "customer",
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: process.env.USERS_TABLE, Item: item }));
    return json(200, item);
  }

  return json(200, out.Item);
}
