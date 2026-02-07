import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const id = event.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  await ddb.send(
    new DeleteCommand({
      TableName: process.env.VEHICLES_TABLE,
      Key: { vehicleId: id },
    })
  );

  return json(200, { ok: true });
}
