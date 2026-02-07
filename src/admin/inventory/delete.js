import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const sku = event.pathParameters?.sku;
  if (!sku) return json(400, { message: "Missing sku" });

  await ddb.send(
    new DeleteCommand({
      TableName: process.env.INVENTORY_TABLE,
      Key: { sku },
    })
  );

  return json(200, { ok: true, sku });
}
