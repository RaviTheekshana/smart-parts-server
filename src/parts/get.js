import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json } from "../_shared/aws.js";

export async function handler(event) {
  const id = event?.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  const out = await ddb.send(new GetCommand({ TableName: process.env.PARTS_TABLE, Key: { partId: id } }));
  if (!out.Item) return json(404, { message: "Not found" });
  return json(200, { ...out.Item, id: out.Item.partId });
}
