import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { nanoid } from "nanoid";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  console.log("Checking for existing admin user...");

  const existingAdmin = await db.query.users.findFirst({
    where: eq(schema.users.email, adminEmail),
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);
    return;
  }

  console.log("Creating admin user...");

  const hashedPassword = await hash(adminPassword, 12);

  await db.insert(schema.users).values({
    id: nanoid(),
    name: "Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "superadmin",
  });

  console.log(`Admin user created: ${adminEmail}`);
}

async function runSeed() {
  console.log("Running seed...");

  const start = Date.now();

  await seedAdmin();

  const end = Date.now();

  console.log(`Seed completed in ${end - start}ms`);

  await client.end();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seed failed");
  console.error(err);
  process.exit(1);
});
