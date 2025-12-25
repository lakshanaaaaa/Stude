import { scrapeStudentData } from "../scrapers/index";

async function testScraping() {
  console.log("🧪 Testing Scraping Functionality\n");

  // Test with sample usernames (replace with real ones for actual testing)
  const testCases = [
    {
      name: "Test Case 1",
      leetcode: "tourist",
      codechef: "tourist",
      codeforces: "tourist",
    },
    {
      name: "Test Case 2 - LeetCode Only",
      leetcode: "tourist",
      codechef: undefined,
      codeforces: undefined,
    },
    {
      name: "Test Case 3 - Codeforces Only",
      leetcode: undefined,
      codechef: undefined,
      codeforces: "tourist",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log("─".repeat(50));

    try {
      const result = await scrapeStudentData(
        testCase.leetcode,
        testCase.codechef,
        testCase.codeforces
      );

      console.log("\n✅ Scraping completed successfully!");
      console.log("\n📊 Problem Stats:");
      console.log(`   Total: ${result.problemStats.total}`);
      console.log(`   Easy: ${result.problemStats.easy}`);
      console.log(`   Medium: ${result.problemStats.medium}`);
      console.log(`   Hard: ${result.problemStats.hard}`);

      console.log("\n🏆 Contest Stats:");
      console.log(`   Current Rating: ${result.contestStats.currentRating}`);
      console.log(`   Highest Rating: ${result.contestStats.highestRating}`);
      console.log(`   Total Contests: ${result.contestStats.totalContests}`);

      console.log("\n🎖️  Badges:");
      result.badges.forEach((badge) => {
        console.log(`   ${badge.icon} ${badge.name} (${badge.platform})`);
      });

      console.log("\n🌐 Platform Stats:");
      Object.entries(result.problemStats.platformStats).forEach(([platform, count]) => {
        if (count > 0) {
          console.log(`   ${platform}: ${count}`);
        }
      });
    } catch (error) {
      console.error(`\n❌ Error: ${error}`);
    }

    // Wait before next test
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log("\n\n✨ Testing completed!");
}

// Run the test
testScraping().catch(console.error);
