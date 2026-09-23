import { resetAndSeedDatabase } from "../src/lib/seed-data";

async function main() {
  const res = await resetAndSeedDatabase();
  console.log("✔ Seed completed successfully:", res);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  });
