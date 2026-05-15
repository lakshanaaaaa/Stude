import "dotenv/config";
import { connectMongoDB } from "../db/mongodb";
import { EnhancedAnalyticsService } from "../services/enhancedAnalyticsService";
import { StudentModel } from "../models/Student";

/**
 * Test script for enhanced analytics
 * Generates sample data in the desired JSON format
 */
async function testEnhancedAnalytics() {
  try {
    await connectMongoDB();
    console.log("Connected to MongoDB");

    // Get a sample student
    const student = await StudentModel.findOne({});
    if (!student) {
      console.log("No students found in database");
      return;
    }

    console.log(`Testing enhanced analytics for student: ${student.username}`);

    // Generate enhanced analytics
    const analytics = await EnhancedAnalyticsService.generateStudentAnalytics(student.id);
    
    console.log("\n=== Enhanced Analytics Result ===");
    console.log(JSON.stringify(analytics, null, 2));

    // Update the student with enhanced analytics
    await EnhancedAnalyticsService.updateStudentEnhancedAnalytics(student.id);
    console.log("\n✅ Student updated with enhanced analytics");

    // Fetch updated student to verify
    const updatedStudent = await StudentModel.findOne({ id: student.id });
    if (updatedStudent) {
      console.log("\n=== Updated Student Data ===");
      console.log("Skill Vector:", updatedStudent.skillVector);
      console.log("Performance Metrics:", updatedStudent.performanceMetrics);
      console.log("Activity Metrics:", updatedStudent.activityMetrics);
      console.log("Project Metrics:", updatedStudent.projectMetrics);
    }

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testEnhancedAnalytics();