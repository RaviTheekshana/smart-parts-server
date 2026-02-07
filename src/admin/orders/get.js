import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const id = event.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  const out = await ddb.send(
    new GetCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId: id },
    })
  );

  if (!out.Item) return json(404, { message: "Order not found" });

  return json(200, { order: out.Item });
}
