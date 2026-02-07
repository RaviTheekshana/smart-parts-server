import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const id = event.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  const body = event.body ? JSON.parse(event.body) : {};

  const sets = [];
  const names = {};
  const values = {};

  function setField(attr, value) {
    const n = `#${attr}`;
    const v = `:${attr}`;
    names[n] = attr;
    values[v] = value;
    sets.push(`${n} = ${v}`);
  }

  if (body.make !== undefined) setField("make", String(body.make || "").trim());
  if (body.model !== undefined) setField("model", String(body.model || "").trim());
  if (body.year !== undefined) setField("year", Math.trunc(Number(body.year)));
  if (body.engine !== undefined) setField("engine", String(body.engine || "").trim());
  if (body.transmission !== undefined) setField("transmission", String(body.transmission || "").trim());
  if (body.trim !== undefined) setField("trim", String(body.trim || "").trim());

  setField("updatedAt", new Date().toISOString());

  await ddb.send(
    new UpdateCommand({
      TableName: process.env.VEHICLES_TABLE,
      Key: { vehicleId: id },
      UpdateExpression: "SET " + sets.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );

  return json(200, { ok: true });
}
