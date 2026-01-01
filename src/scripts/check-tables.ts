import { sql } from "drizzle-orm";
import { db } from "@/db";

async function main() {
  try {
    const result = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'pz9cwpnyi2mbyf3' ORDER BY table_name`,
    );
    console.log("All tables in schema:");
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
main();
