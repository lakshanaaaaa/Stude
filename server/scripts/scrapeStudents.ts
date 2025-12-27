import { config } from "dotenv";
config(); // Load .env file

import { connectMongoDB } from "../db/mongodb";
import { MongoStorage } from "../storage/mongodb";
import { scrapeStudentData } from "../scrapers";
import { StudentModel } from "../models/Student";
import type { CodingAccount } from "@shared/schema";

interface StudentUsernameMap {
  username: string;
  leetcode?: string;
  codechef?: string;
}

/**
 * Scrapes data for all students or specific students
 */
export async function scrapeAllStudents(usernames?: StudentUsernameMap[]) {
  await connectMongoDB();
  const storage = new MongoStorage();

  // Get all students from database
  const allStudents = await storage.getAllStudents();

  // If usernames provided, use those; otherwise use all students
  const studentsToScrape = usernames
    ? allStudents.filter((s) => usernames.some((u) => u.username === s.username))
    : allStudents;

  console.log(`\n🚀 Starting to scrape data for ${studentsToScrape.length} students...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < studentsToScrape.length; i++) {
    const student = studentsToScrape[i];
    const usernameMap = usernames?.find((u) => u.username === student.username);

    console.log(`[${i + 1}/${studentsToScrape.length}] Processing ${student.name} (${student.username})...`);

    try {
      // Get platform usernames
      const leetcodeAccount = student.mainAccounts.find((a) => a.platform === "LeetCode");
      const codechefAccount = student.subAccounts.find((a) => a.platform === "CodeChef");
      const gfgAccount = student.subAccounts.find((a) => a.platform === "GeeksforGeeks");
      const hrAccount = student.subAccounts.find((a) => a.platform === "HackerRank");

      const leetcodeUsername = usernameMap?.leetcode || leetcodeAccount?.username;
      const codechefUsername = usernameMap?.codechef || codechefAccount?.username;
      const gfgUsername = gfgAccount?.username;
      const hrUsername = hrAccount?.username;

      if (!leetcodeUsername && !codechefUsername && !gfgUsername && !hrUsername) {
        console.log(`  ⚠️  No platform usernames found, skipping...`);
        continue;
      }

      const scrapedData = await scrapeStudentData(leetcodeUsername, codechefUsername, undefined, gfgUsername, hrUsername);

      // Update student analytics
      await storage.updateStudentAnalytics(student.username, {
        problemStats: scrapedData.problemStats,
        contestStats: scrapedData.contestStats,
        badges: scrapedData.badges,
      });

      console.log(`  ✅ Scraped successfully:`);
      console.log(`     - Problems solved: ${scrapedData.problemStats.total}`);
      console.log(`     - Current rating: ${scrapedData.contestStats.currentRating}`);
      console.log(`     - Badges: ${scrapedData.badges.length}`);

      successCount++;

      // Rate limiting delay
      if (i < studentsToScrape.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay between students
      }
    } catch (error: any) {
      console.error(`  ❌ Error scraping ${student.username}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✨ Scraping completed!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeAllStudents()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

