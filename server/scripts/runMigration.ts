#!/usr/bin/env node

import { populateStudentEnhancements } from "./populateStudentEnhancements.js";

/**
 * Migration runner script
 * Usage: npm run migrate
 */
async function runMigration() {
  console.log("🚀 Starting database migration...");
  console.log("📝 Adding new fields: skills, projects, weeklyActivity, derivedScores");
  
  try {
    await populateStudentEnhancements();
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}