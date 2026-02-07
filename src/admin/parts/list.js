import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, json, getUserContext } from "../../_shared/aws.js";

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export async function handler(event) {

  const qs = event.queryStringParameters || {};
  const query = String(qs.query || "").trim().toLowerCase();
  const page = toInt(qs.page, 1);
  const limit = Math.min(toInt(qs.limit, 20), 100);

  // Simple coursework approach: Scan and filter in-memory
  const out = await ddb.send(
    new ScanCommand({
      TableName: process.env.PARTS_TABLE,
    })
  );

  let items = out.Items || [];

  // Optional search
  if (query) {
    items = items.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const sku = String(p.sku || "").toLowerCase();
      const brand = String(p.brand || "").toLowerCase();
      return name.includes(query) || sku.includes(query) || brand.includes(query);
    });
  }

  // Sort newest first if createdAt exists
  items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  const parts = items.slice(start, start + limit);

  return json(200, {
    parts,
    total,
    page,
    pageSize: limit,
    totalPages,
  });
}
