import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../_shared/aws.js";

// Event: PaymentSucceeded => mark order paid
export async function handler(event) {
  const detail = event.detail || {};
  const orderId = detail.orderId;
  if (!orderId) return;

  await ddb.send(new UpdateCommand({
    TableName: process.env.ORDERS_TABLE,
    Key: { orderId },
    UpdateExpression: "SET #s = :paid, paymentId = :pid, updatedAt = :t",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":paid": "PAID", ":pid": detail.paymentId || null, ":t": new Date().toISOString() }
  }));
}
