import { scrapeLeetCode } from "../scrapers/leetcode";
import { scrapeCodeChef } from "../scrapers/codechef";
import { scrapeCodeForces } from "../scrapers/codeforces";

async function quickTest() {
  console.log("🧪 Quick Scraper Test\n");

  // Test LeetCode
  console.log("Testing LeetCode scraper...");
  try {
    const leetcodeResult = await scrapeLeetCode("leetcode");
    console.log("✅ LeetCode Success:");
    console.log(`   Problems: ${leetcodeResult.problemStats.total}`);
    console.log(`   Rating: ${leetcodeResult.contestStats.currentRating}`);
  } catch (error: any) {
    console.error("❌ LeetCode Error:", error.message);
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
