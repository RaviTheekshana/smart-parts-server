import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {
  const ctx = getUserContext(event);
  if (!ctx?.userId) return json(401, { message: "Unauthorized" });
  if (!ctx.isAdmin) return json(403, { message: "Forbidden" });

  const id = event?.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  await ddb.send(new DeleteCommand({ TableName: process.env.PARTS_TABLE, Key: { partId: id } }));
  return { statusCode: 204, body: "" };
}
