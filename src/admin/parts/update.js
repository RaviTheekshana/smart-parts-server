import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

export async function handler(event) {

  const id = event?.pathParameters?.id;
  if (!id) return json(400, { message: "Missing id" });

  const body = event.body ? JSON.parse(event.body) : {};
  const updates = [];
  const values = { ":t": new Date().toISOString() };
  const names = {};

  function set(field, value) {
    const nameKey = "#" + field;
    const valKey = ":" + field;
    names[nameKey] = field;
    values[valKey] = value;
    updates.push(`${nameKey} = ${valKey}`);
  }

  if (body.sku) set("sku", body.sku);
  if (body.name) set("name", body.name);
  if (body.price !== undefined) set("price", Number(body.price));
  if (body.description !== undefined) set("description", body.description);
  if (body.category !== undefined) set("category", body.category);
  if (body.images !== undefined) set("images", Array.isArray(body.images) ? body.images : []);

  set("updatedAt", values[":t"]);

  const expr = "SET " + updates.join(", ");

  await ddb.send(new UpdateCommand({
    TableName: process.env.PARTS_TABLE,
    Key: { partId: id },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values
  }));

  return json(200, { message: "Updated" });
}
