import "dotenv/config";
import { connectMongoDB } from "../db/mongodb";
import { EnhancedAnalyticsService } from "../services/enhancedAnalyticsService";
import { StudentModel } from "../models/Student";

/**
 * Migration script to populate existing students with enhanced analytics
 */
async function migrateToEnhancedAnalytics() {
  try {
    await connectMongoDB();
    console.log("Connected to MongoDB");

    const students = await StudentModel.find({});
    console.log(`Found ${students.length} students to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        console.log(`Processing student: ${student.username} (${student.id})`);
        
          // Combine existing skills, project‑derived skills, and inferred coding skills
          const existingSkills = student.skills || [];
          const projectSkills = EnhancedAnalyticsService.extractAndNormalizeSkillsFromProjects(student);
          const inferredSkills = EnhancedAnalyticsService.inferSkillsFromCoding(student);
          let combinedSkills = [...new Set([...existingSkills, ...projectSkills, ...inferredSkills])];
          if (combinedSkills.length === 0) {
            combinedSkills = ['DSA', 'React', 'SQL'];
          }
          await StudentModel.updateOne(
            { id: student.id },
            { $set: { skills: combinedSkills } }
          );
          console.log(`  ✅ Updated skills: ${combinedSkills.join(', ')}`);

        // Generate and update enhanced analytics
        await EnhancedAnalyticsService.updateStudentEnhancedAnalytics(student.id);
        
        successCount++;
        console.log(`  ✅ Enhanced analytics updated successfully`);
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Failed to update student ${student.username}:`, error);
      }
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`✅ Successfully migrated: ${successCount} students`);
    console.log(`❌ Failed migrations: ${errorCount} students`);

    // Show sample of migrated data
    if (successCount > 0) {
      const sampleStudent = await StudentModel.findOne({
        skillVector: { $exists: true, $ne: {} }
      });
      
      if (sampleStudent) {
        console.log(`\n=== Sample Migrated Data (${sampleStudent.username}) ===`);
        const analytics = await EnhancedAnalyticsService.generateStudentAnalytics(sampleStudent.id);
        console.log(JSON.stringify(analytics, null, 2));
      }
    }

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateToEnhancedAnalytics();