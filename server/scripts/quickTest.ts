import { scrapeLeetCode } from "../scrapers/leetcode";
import { scrapeCodeChef } from "../scrapers/codechef";
import { scrapeCodeForces } from "../scrapers/codeforces";

async function quickTest() {
  console.log("🧪 Quick Scraper Test\n");

  // Test LeetCode with Dinesh_s0203
  console.log("Testing LeetCode scraper with Dinesh_s0203...");
  try {
    const leetcodeResult = await scrapeLeetCode("Dinesh_s0203");
    console.log("✅ LeetCode Success:");
    console.log(`   Total Problems: ${leetcodeResult.problemStats.total}`);
    console.log(`   Easy: ${leetcodeResult.problemStats.easy}`);
    console.log(`   Medium: ${leetcodeResult.problemStats.medium}`);
    console.log(`   Hard: ${leetcodeResult.problemStats.hard}`);
    console.log(`   Platform Stats LeetCode: ${leetcodeResult.problemStats.platformStats.LeetCode}`);
    console.log(`   Current Rating: ${leetcodeResult.contestStats.currentRating}`);
    console.log(`   Highest Rating: ${leetcodeResult.contestStats.highestRating}`);
    console.log(`   Total Contests: ${leetcodeResult.contestStats.totalContests}`);
    console.log(`   Badges: ${leetcodeResult.badges.length}`);
  } catch (error: any) {
    console.error("❌ LeetCode Error:", error.message);
    if (error.response) {
      console.error("   Response status:", error.response.status);
      console.error("   Response data:", JSON.stringify(error.response.data).substring(0, 500));
    }
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test CodeChef
  console.log("Testing CodeChef scraper...");
  try {
    // Test with a known CodeChef username (you can change this)
    const codechefResult = await scrapeCodeChef("dinesh_s0203");
    console.log("✅ CodeChef Success:");
    console.log(`   Total Problems: ${codechefResult.problemStats.total}`);
    console.log(`   Platform Stats CodeChef: ${codechefResult.problemStats.platformStats.CodeChef}`);
    console.log(`   Current Rating: ${codechefResult.contestStats.currentRating}`);
    console.log(`   Highest Rating: ${codechefResult.contestStats.highestRating}`);
    console.log(`   Total Contests: ${codechefResult.contestStats.totalContests}`);
    console.log(`   Badges: ${codechefResult.badges.length}`);
  } catch (error: any) {
    console.error("❌ CodeChef Error:", error.message);
    if (error.response) {
      console.error("   Response status:", error.response.status);
    }
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test Codeforces
  console.log("Testing Codeforces scraper...");
  try {
    const cfResult = await scrapeCodeForces("tourist");
    console.log("✅ Codeforces Success:");
    console.log(`   Problems: ${cfResult.problemStats.total}`);
    console.log(`   Rating: ${cfResult.contestStats.currentRating}`);
  } catch (error: any) {
    console.error("❌ Codeforces Error:", error.message);
  }

  console.log("\n✨ Test Complete!");
}

quickTest().catch(console.error);
