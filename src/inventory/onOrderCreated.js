import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../_shared/aws.js";

// Event: OrderCreated => reserve stock (simple)
export async function handler(event) {
  const detail = event.detail || {};
  const items = detail.items || [];
  for (const it of items) {
    const sku = it.sku;
    const qty = Number(it.qty || 0);
    if (!sku || qty <= 0) continue;

    const current = await ddb.send(new GetCommand({ TableName: process.env.INVENTORY_TABLE, Key: { sku } }));
    const onHand = Number(current.Item?.qtyOnHand || 0);
    const reserved = Number(current.Item?.qtyReserved || 0);

    if (onHand - reserved < qty) {
      // Not enough stock; we don't fail the whole lambda for coursework simplicity.
      continue;
    }

    await ddb.send(new UpdateCommand({
      TableName: process.env.INVENTORY_TABLE,
      Key: { sku },
      UpdateExpression: "SET qtyReserved = if_not_exists(qtyReserved, :z) + :q, updatedAt = :t",
      ExpressionAttributeValues: { ":q": qty, ":z": 0, ":t": new Date().toISOString() }
    }));
  }
}
