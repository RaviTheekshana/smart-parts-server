import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

const ALLOWED_STATUSES = new Set([
  "CREATED",
  "RESERVED",
  "PAID",
  "CANCELLED",
  "REFUNDED",
]);

export async function handler(event) {

  const id = event.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  const body = event.body ? JSON.parse(event.body) : {};
  const status = body.status ? String(body.status).trim().toUpperCase() : null;
  const notes = body.notes !== undefined ? String(body.notes || "") : undefined;

  const sets = [];
  const names = {};
  const values = {};

  function setField(attr, val) {
    const n = "#" + attr;
    const v = ":" + attr;
    names[n] = attr;
    values[v] = val;
    sets.push(`${n} = ${v}`);
  }

  if (status) {
    if (!ALLOWED_STATUSES.has(status)) {
      return json(400, { message: `Invalid status. Allowed: ${Array.from(ALLOWED_STATUSES).join(", ")}` });
    }
    setField("status", status);
  }

  if (notes !== undefined) {
    setField("adminNotes", notes);
  }

  setField("updatedAt", new Date().toISOString());

  await ddb.send(
    new UpdateCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId: id },
      UpdateExpression: "SET " + sets.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );

  return json(200, { ok: true });
}
