import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";
import { randomUUID } from "crypto";

export async function handler(event) {

  const body = event.body ? JSON.parse(event.body) : {};
  const make = String(body.make || "").trim();
  const model = String(body.model || "").trim();
  const year = body.year !== undefined ? Number(body.year) : null;

  if (!make || !model || !Number.isFinite(year)) {
    return json(400, { message: "make, model, year required" });
  }

  const vehicleId = randomUUID();
  const now = new Date().toISOString();

  const item = {
    vehicleId,
    make,
    model,
    year: Math.trunc(year),
    engine: body.engine ? String(body.engine).trim() : "",
    transmission: body.transmission ? String(body.transmission).trim() : "",
    trim: body.trim ? String(body.trim).trim() : "",
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(
    new PutCommand({
      TableName: process.env.VEHICLES_TABLE,
      Item: item,
    })
  );

  return json(200, { vehicle: item });
}
