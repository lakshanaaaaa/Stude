import { config } from "dotenv";
config(); // Load .env file

import { readFileSync, writeFileSync } from "fs";
import { connectMongoDB } from "../db/mongodb";
import { updateUsernamesAndScrape } from "./updateUsernamesAndScrape";

interface StudentUsernameMap {
  username: string;
  leetcode?: string;
  codechef?: string;
}

/**
 * Reads username mappings from a JSON file and updates/scrapes
 * 
 * Expected JSON format:
 * [
 *   { "username": "aadhisankara", "leetcode": "actual_lc_username", "codechef": "actual_cc_username" },
 *   ...
 * ]
 */
async function main() {
  const args = process.argv.slice(2);
  const jsonFile = args[0] || "usernames.json";

  try {
    console.log(`📖 Reading username mappings from ${jsonFile}...`);
    const fileContent = readFileSync(jsonFile, "utf-8");
    const usernameMappings: StudentUsernameMap[] = JSON.parse(fileContent);

    if (!Array.isArray(usernameMappings)) {
      throw new Error("JSON file must contain an array of username mappings");
    }

    console.log(`✅ Found ${usernameMappings.length} username mappings\n`);

    await updateUsernamesAndScrape(usernameMappings);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error(`❌ File ${jsonFile} not found!`);
      console.log("\n📝 Please create a JSON file with the following format:");
      console.log(`
[
  {
    "username": "aadhisankara",
    "leetcode": "actual_leetcode_username",
    "codechef": "actual_codechef_username"
  },
  {
    "username": "aagneshshifak",
    "leetcode": "another_leetcode_username",
    "codechef": "another_codechef_username"
  }
  // ... add all 54 students
]
      `);
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

main();

