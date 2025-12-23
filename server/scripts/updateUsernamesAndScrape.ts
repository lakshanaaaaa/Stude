import { config } from "dotenv";
config(); // Load .env file

import { connectMongoDB } from "../db/mongodb";
import { MongoStorage } from "../storage/mongodb";
import { scrapeStudentData } from "../scrapers";
import { StudentModel } from "../models/Student";

interface StudentUsernameMap {
  username: string;
  leetcode?: string;
  codechef?: string;
}

/**
 * Updates usernames and scrapes data for students
 * Usage: Provide a JSON file or array of username mappings
 */
export async function updateUsernamesAndScrape(usernameMappings: StudentUsernameMap[]) {
  await connectMongoDB();
  const storage = new MongoStorage();

  console.log(`\n🔄 Updating usernames and scraping data for ${usernameMappings.length} students...\n`);

  for (let i = 0; i < usernameMappings.length; i++) {
    const mapping = usernameMappings[i];
    const student = await storage.getStudentByUsername(mapping.username);

    if (!student) {
      console.log(`⚠️  Student ${mapping.username} not found, skipping...`);
      continue;
    }

    console.log(`[${i + 1}/${usernameMappings.length}] Processing ${student.name} (${student.username})...`);

    try {
      // Update usernames if provided
      const updates: any = {};
      let needsUpdate = false;

      if (mapping.leetcode) {
        // Update or add LeetCode account
        const mainAccounts = [...student.mainAccounts];
        const leetcodeIndex = mainAccounts.findIndex((a) => a.platform === "LeetCode");
        if (leetcodeIndex >= 0) {
          mainAccounts[leetcodeIndex].username = mapping.leetcode;
        } else {
          mainAccounts.push({ platform: "LeetCode", username: mapping.leetcode });
        }
        updates.mainAccounts = mainAccounts;
        needsUpdate = true;
      }

      if (mapping.codechef) {
        // Update or add CodeChef account
        const subAccounts = [...student.subAccounts];
        const codechefIndex = subAccounts.findIndex((a) => a.platform === "CodeChef");
        if (codechefIndex >= 0) {
          subAccounts[codechefIndex].username = mapping.codechef;
        } else {
          subAccounts.push({ platform: "CodeChef", username: mapping.codechef });
        }
        updates.subAccounts = subAccounts;
        needsUpdate = true;
      }

      // Update student if usernames changed
      if (needsUpdate) {
        await storage.updateStudent(student.username, updates);
        console.log(`  ✅ Updated usernames`);
      }

      // Scrape data
      const leetcodeUsername = mapping.leetcode || student.mainAccounts.find((a) => a.platform === "LeetCode")?.username;
      const codechefUsername = mapping.codechef || student.subAccounts.find((a) => a.platform === "CodeChef")?.username;

      if (!leetcodeUsername && !codechefUsername) {
        console.log(`  ⚠️  No LeetCode or CodeChef username found, skipping scrape...`);
        continue;
      }

      console.log(`  🔍 Scraping data...`);
      const scrapedData = await scrapeStudentData(leetcodeUsername, codechefUsername);

      // Update analytics
      await storage.updateStudentAnalytics(student.username, {
        problemStats: scrapedData.problemStats,
        contestStats: scrapedData.contestStats,
        badges: scrapedData.badges,
      });

      console.log(`  ✅ Scraped successfully:`);
      console.log(`     - Problems solved: ${scrapedData.problemStats.total}`);
      console.log(`     - Current rating: ${scrapedData.contestStats.currentRating}`);
      console.log(`     - Badges: ${scrapedData.badges.length}`);

      // Rate limiting delay
      if (i < usernameMappings.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
      }
    } catch (error: any) {
      console.error(`  ❌ Error processing ${student.username}:`, error.message);
    }
  }

  console.log(`\n✨ Done!\n`);
}

// Example usage - you can import this function and call it with your data
// Or create a JSON file and read it here

