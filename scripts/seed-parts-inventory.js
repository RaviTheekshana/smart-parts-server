import "dotenv/config";
import { randomUUID } from "crypto";
import { BatchWriteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getDdb, chunk } from "./_ddb.js";

const ddb = getDdb();

const PARTS_TABLE = process.env.PARTS_TABLE;
const INVENTORY_TABLE = process.env.INVENTORY_TABLE;

const SEED_PREFIX = process.env.SEED_PREFIX || "SEED";
const SEED_RESET = process.env.SEED_RESET === "1";
const SEED_PARTS = parseInt(process.env.SEED_PARTS || "400", 10);

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const brands = ["Toyota","Nissens","Denso","Bosch","Advics","KYB","NGK","Mahle","Mann","Valeo","ACDelco"];
const categories = [
  ["Brakes","Pads"], ["Brakes","Rotors"], ["Brakes","Calipers"],
  ["Engine","Filters"], ["Engine","Cooling"], ["Engine","Belts"],
  ["Electrical","Charging"], ["Electrical","Ignition"],
  ["Suspension","Shocks"], ["Suspension","Struts"], ["Suspension","Control Arms"],
  ["Drivetrain","CV Joints"], ["Exhaust","Mufflers"], ["Body","Mirrors"]
];

async function batchWrite(tableName, requests) {
  for (const group of chunk(requests, 25)) {
    await ddb.send(new BatchWriteCommand({ RequestItems: { [tableName]: group } }));
  }
}

async function resetSeededParts() {
  // Delete only items with sku starting SEED_PREFIX-
  const scan = await ddb.send(new ScanCommand({ TableName: PARTS_TABLE }));
  const items = (scan.Items || []).filter((p) => String(p.sku || "").startsWith(`${SEED_PREFIX}-`));

  if (!items.length) return;

  // delete parts
  await batchWrite(
    PARTS_TABLE,
    items.map((p) => ({ DeleteRequest: { Key: { partId: p.partId } } }))
  );

  // delete inventory for those SKUs
  await batchWrite(
    INVENTORY_TABLE,
    items.map((p) => ({ DeleteRequest: { Key: { sku: p.sku } } }))
  );

  console.log(`🧹 Reset deleted seeded parts=${items.length} and matching inventory`);
}

async function main() {
  if (!PARTS_TABLE || !INVENTORY_TABLE) {
    console.error("❌ PARTS_TABLE / INVENTORY_TABLE env vars not set (serverless.yml provider.environment).");
    process.exit(1);
  }

  if (SEED_RESET) {
    console.log("SEED_RESET=1 → deleting previous seeded batch...");
    await resetSeededParts();
  }

  const parts = [];
  const inventory = [];

  for (let i = 0; i < SEED_PARTS; i++) {
    const cat = rand(categories);
    const brand = rand(brands);
    const sku = `${SEED_PREFIX}-${cat[0].slice(0,3).toUpperCase()}-${cat[1].slice(0,3).toUpperCase()}-${i}`;

    const part = {
      partId: randomUUID(),
      sku,
      oemCode: `${rint(10000, 99999)}-OEM`,
      name: `${brand} ${cat[1]} ${sku}`,
      categoryPath: cat,
      brand,
      price: rint(1500, 120000),
      images: [],
      createdAt: new Date().toISOString(),
    };

    parts.push(part);

    inventory.push({
      sku: part.sku,
      qtyOnHand: rint(0, 80),
      qtyReserved: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  // Write Parts
  await batchWrite(
    PARTS_TABLE,
    parts.map((Item) => ({ PutRequest: { Item } }))
  );

  // Write Inventory
  await batchWrite(
    INVENTORY_TABLE,
    inventory.map((Item) => ({ PutRequest: { Item } }))
  );

  console.log(`✅ Seeded parts=${parts.length}, inventory=${inventory.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
