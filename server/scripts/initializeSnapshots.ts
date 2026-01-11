/**
 * Migration script to initialize weekly snapshots for existing students
 * Run this once after deploying the Topper of the Week feature
 * 
 * Usage: npx tsx server/scripts/initializeSnapshots.ts
 */

import { createDailySnapshot } from "../services/snapshotService";
import { storage } from "../storage";

async function initializeSnapshots() {
  console.log("[Migration] Starting snapshot initialization...");
  
  try {
    // Check if we have any students
    const students = await storage.getAllStudents();
    console.log(`[Migration] Found ${students.length} students`);
    
    if (students.length === 0) {
      console.log("[Migration] No students found. Nothing to do.");
      return;
    }

    // Create initial snapshot
    console.log("[Migration] Creating initial snapshot...");
    const result = await createDailySnapshot();
    
    console.log(`[Migration] ✓ Successfully created ${result.snapshotsCreated} snapshots`);
    if (result.errors > 0) {
      console.log(`[Migration] ⚠ ${result.errors} errors occurred`);
    }
    
    console.log("[Migration] Snapshot initialization complete!");
    console.log("[Migration] Note: Students will need to wait 7 days for weekly metrics to be calculated.");
    
  } catch (error) {
    console.error("[Migration] Failed to initialize snapshots:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeSnapshots()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeSnapshots };
