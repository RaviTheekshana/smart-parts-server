import "dotenv/config";
import { randomUUID } from "crypto";
import { BatchWriteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getDdb, chunk } from "./_ddb.js";

const ddb = getDdb();

const VEHICLES_TABLE = process.env.VEHICLES_TABLE;
const SEED_RESET = process.env.SEED_RESET === "1";
const SEED_VEHICLES = parseInt(process.env.SEED_VEHICLES || "250", 10);

const makes = ["Toyota", "Honda", "Nissan", "Ford", "BMW", "Hyundai", "Kia"];
const modelsByMake = {
  Toyota: ["Corolla", "Camry", "Yaris", "RAV4"],
  Honda: ["Civic", "Accord", "Fit", "CR-V"],
  Nissan: ["Sentra", "Altima", "Micra", "Qashqai"],
  Ford: ["Focus", "Fiesta", "Fusion", "Escape"],
  BMW: ["320i", "330i", "X1", "X3"],
  Hyundai: ["Elantra", "Sonata", "i20", "Tucson"],
  Kia: ["Rio", "Cerato", "Sportage", "Seltos"],
};
const engines = ["1.2L", "1.3L", "1.5L", "1.6L", "1.8L", "2.0L", "2.5L", "3.0L"];
const transmissions = ["AT", "MT", "CVT", "DCT"];
const trims = ["Base", "L", "LE", "SE", "XLE", "Sport", "Premium"];
const years = Array.from({ length: 10 }, (_, i) => 2016 + i);

const rand = (a) => a[Math.floor(Math.random() * a.length)];

async function batchPut(tableName, items) {
  for (const group of chunk(items, 25)) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: group.map((Item) => ({ PutRequest: { Item } })),
        },
      })
    );
  }
}

async function resetTable(tableName) {
  // Safe/dev reset: scan and delete in batches (OK for small datasets)
  const scan = await ddb.send(new ScanCommand({ TableName: tableName }));
  const items = scan.Items || [];
  if (!items.length) return;

  for (const group of chunk(items, 25)) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: group.map((it) => ({
            DeleteRequest: { Key: { vehicleId: it.vehicleId } },
          })),
        },
      })
    );
  }
}

async function main() {
  if (!VEHICLES_TABLE) {
    console.error("❌ VEHICLES_TABLE env var not set. Add it in serverless.yml provider.environment.");
    process.exit(1);
  }

  if (SEED_RESET) {
    console.log("SEED_RESET=1 → deleting existing vehicles...");
    await resetTable(VEHICLES_TABLE);
  }

  const vehicles = [];
  for (let i = 0; i < SEED_VEHICLES; i++) {
    const make = rand(makes);
    vehicles.push({
      vehicleId: randomUUID(),
      make,
      model: rand(modelsByMake[make]),
      year: rand(years),
      engine: rand(engines),
      transmission: rand(transmissions),
      trim: rand(trims),
    });
  }

  await batchPut(VEHICLES_TABLE, vehicles);
  console.log(`✅ Seeded vehicles: ${vehicles.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
