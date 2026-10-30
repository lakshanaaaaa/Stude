import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL || typeof process.env.DATABASE_URL !== 'string') { throw new Error('Invalid DATABASE_URL'); }
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
