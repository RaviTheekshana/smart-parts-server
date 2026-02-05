import "dotenv/config";

console.log("➡️ Seeding Vehicles...");
await import("./seed-vehicles.js");

console.log("➡️ Seeding Parts + Inventory...");
await import("./seed-parts-inventory.js");

console.log("✅ All seed completed.");
