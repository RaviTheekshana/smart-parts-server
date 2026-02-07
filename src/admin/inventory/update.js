import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const sku = event.pathParameters?.sku;
  if (!sku) return json(400, { message: "Missing sku" });

  const body = event.body ? JSON.parse(event.body) : {};

  const qtyOnHand =
    body.qtyOnHand !== undefined ? Number(body.qtyOnHand) : undefined;
  const qtyReserved =
    body.qtyReserved !== undefined ? Number(body.qtyReserved) : undefined;

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

  if (qtyOnHand !== undefined) {
    if (!Number.isFinite(qtyOnHand) || qtyOnHand < 0) {
      return json(400, { message: "qtyOnHand must be number >= 0" });
    }
    setField("qtyOnHand", Math.trunc(qtyOnHand));
  }

  if (qtyReserved !== undefined) {
    if (!Number.isFinite(qtyReserved) || qtyReserved < 0) {
      return json(400, { message: "qtyReserved must be number >= 0" });
    }
    setField("qtyReserved", Math.trunc(qtyReserved));
  }

  setField("updatedAt", new Date().toISOString());

  await ddb.send(
    new UpdateCommand({
      TableName: process.env.INVENTORY_TABLE,
      Key: { sku },
      UpdateExpression: "SET " + sets.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );

  return json(200, { ok: true, sku });
}
