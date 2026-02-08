import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json } from "../../_shared/aws.js";

export async function handler(event) {
  const id = event?.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  const body = event.body ? JSON.parse(event.body) : {};

  const updates = [];
  const values = {};
  const names = {};

  function set(field, value) {
    const nameKey = "#" + field;
    const valKey = ":" + field;
    names[nameKey] = field;
    values[valKey] = value;
    updates.push(`${nameKey} = ${valKey}`);
  }

  // ✅ sanitize + include brand
  if (body.sku !== undefined) {
    const v = String(body.sku || "").trim();
    if (v) set("sku", v);
  }

  if (body.name !== undefined) {
    const v = String(body.name || "").trim();
    if (v) set("name", v);
  }

  if (body.brand !== undefined) {
    const v = String(body.brand || "").trim();
    // store null if empty (same style as create)
    set("brand", v ? v : null);
  }

  if (body.price !== undefined) {
    const n = Number(body.price);
    if (!Number.isFinite(n)) return json(400, { message: "Invalid price" });
    set("price", n);
  }

  if (body.description !== undefined) set("description", body.description ?? null);
  if (body.category !== undefined) set("category", body.category ?? null);

  if (body.images !== undefined) {
    set("images", Array.isArray(body.images) ? body.images : []);
  }

  // always update timestamp
  set("updatedAt", new Date().toISOString());

  const expr = "SET " + updates.join(", ");

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: process.env.PARTS_TABLE,
        Key: { partId: id },
        UpdateExpression: expr,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );

    return json(200, { message: "Updated" });
  } catch (e) {
    console.error("Update part failed", e);
    return json(500, { message: "Update failed" });
  }
}
