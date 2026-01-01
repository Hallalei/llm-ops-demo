import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(databaseUrl);

async function migrateAuth() {
  console.log("Creating auth tables in pz9cwpnyi2mbyf3 schema...");

  try {
    // 创建 users 表
    await sql`
      CREATE TABLE IF NOT EXISTS pz9cwpnyi2mbyf3.users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP,
        image TEXT,
        password TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log("Created users table");

    // 创建 accounts 表
    await sql`
      CREATE TABLE IF NOT EXISTS pz9cwpnyi2mbyf3.accounts (
        "userId" TEXT NOT NULL REFERENCES pz9cwpnyi2mbyf3.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, "providerAccountId")
      )
    `;
    console.log("Created accounts table");

    // 创建 sessions 表
    await sql`
      CREATE TABLE IF NOT EXISTS pz9cwpnyi2mbyf3.sessions (
        "sessionToken" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES pz9cwpnyi2mbyf3.users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      )
    `;
    console.log("Created sessions table");

    // 创建 verification_tokens 表
    await sql`
      CREATE TABLE IF NOT EXISTS pz9cwpnyi2mbyf3.verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;
    console.log("Created verification_tokens table");

    console.log("Auth tables migration completed!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

migrateAuth()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
