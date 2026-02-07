import { ddb, json, getUserContext } from "../../_shared/aws.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {

  const TableName = process.env.ORDERS_TABLE;

  // simplest: scan (ok for assignment / small data)
  const out = await ddb.send(new ScanCommand({ TableName, Limit: 200 }));

  // normalize
  const items = (out.Items || []).map((o) => ({
    orderId: o.orderId,
    userId: o.userId,
    status: o.status,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items || [],
    paymentId: o.paymentId,
    stripeSessionId: o.stripeSessionId,
  }));

  // newest first
  items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  return json(200, items);
};
