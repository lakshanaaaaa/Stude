import { connectMongoDB } from "../db/mongodb";
import { StudentModel } from "../models/Student";
import { StudentAnalyticsService } from "../services/studentAnalyticsService";

/**
 * Script to populate new fields (skills, projects, analytics) for existing students
 */
async function populateStudentEnhancements() {
  try {
    await connectMongoDB();
    console.log("🔄 Starting student enhancement population...");

    const students = await StudentModel.find({});
    console.log(`📊 Found ${students.length} students to process`);

    let processed = 0;
    let updated = 0;

    for (const student of students) {
      try {
        let needsUpdate = false;
        const updateData: any = {};

        // 1. Extract skills if not present
        if (!student.skills || student.skills.length === 0) {
          const skillsFromResume = student.resumeLink ? 
            StudentAnalyticsService.extractSkillsFromText(student.resumeLink) : [];
          
          // Add some default skills based on department
          const defaultSkills = getDefaultSkillsByDepartment(student.dept);
          const combinedSkills = [...new Set([...skillsFromResume, ...defaultSkills])];
          
          if (combinedSkills.length > 0) {
            updateData.skills = combinedSkills;
            needsUpdate = true;
          }
        }

        // 2. Initialize projects array if not present
        if (!student.projects || student.projects.length === 0) {
          updateData.projects = getSampleProjectsByDepartment(student.dept, student.skills || []);
          needsUpdate = true;
        }

        // 2.5. Initialize domains array if not present
        if (!student.domains || student.domains.length === 0) {
          updateData.domains = getDefaultDomainsByDepartment(student.dept);
          needsUpdate = true;
        }

        // 3. Calculate weekly activity
        if (!student.weeklyActivity) {
          try {
            const weeklyActivity = await StudentAnalyticsService.calculateWeeklyActivity(student.id);
            updateData.weeklyActivity = weeklyActivity;
            needsUpdate = true;
          } catch (error) {
            // If calculation fails, set default values
            updateData.weeklyActivity = {
              problemsSolved7Days: 0,
              contestsAttended30Days: 0,
              ratingGrowth30Days: 0,
              lastUpdated: new Date().toISOString()
            };
            needsUpdate = true;
          }
        }

        // 4. Calculate derived scores
        if (!student.derivedScores) {
          const derivedScores = StudentAnalyticsService.calculateDerivedScores(student.toObject());
          updateData.derivedScores = derivedScores;
          needsUpdate = true;
        }

        // Update the student if needed
        if (needsUpdate) {
          await StudentModel.updateOne({ id: student.id }, { $set: updateData });
          updated++;
          console.log(`✅ Updated student: ${student.username}`);
        }

        processed++;
        if (processed % 10 === 0) {
          console.log(`📈 Progress: ${processed}/${students.length} students processed`);
        }

      } catch (error) {
        console.error(`❌ Error processing student ${student.username}:`, error);
      }
    }

    console.log(`🎉 Enhancement population completed!`);
    console.log(`📊 Processed: ${processed} students`);
    console.log(`✅ Updated: ${updated} students`);

  } catch (error) {
    console.error("❌ Error in enhancement population:", error);
  } finally {
    process.exit(0);
  }
}

function getDefaultSkillsByDepartment(dept: string): string[] {
  const deptLower = dept.toLowerCase();
  
  if (deptLower.includes('cse') || deptLower.includes('computer')) {
    return ['JavaScript', 'Python', 'Java', 'DSA', 'SQL', 'Git', 'HTML', 'CSS'];
  } else if (deptLower.includes('ece') || deptLower.includes('electronics')) {
    return ['C++', 'Python', 'MATLAB', 'Embedded Systems', 'DSA'];
  } else if (deptLower.includes('it') || deptLower.includes('information')) {
    return ['JavaScript', 'Python', 'SQL', 'HTML', 'CSS', 'DSA'];
  } else if (deptLower.includes('mech') || deptLower.includes('mechanical')) {
    return ['Python', 'MATLAB', 'CAD', 'SolidWorks'];
  } else {
    return ['Python', 'DSA', 'SQL'];
  }
}

function getSampleProjectsByDepartment(dept: string, skills: string[]): any[] {
  const deptLower = dept.toLowerCase();
  
  if (deptLower.includes('cse') || deptLower.includes('computer')) {
    return [
      {
        name: "Student Management System",
        techStack: skills.slice(0, 3).length > 0 ? skills.slice(0, 3) : ["JavaScript", "Node.js", "MongoDB"],
        domain: "Education Technology",
        impactScore: 75,
        description: "A comprehensive system for managing student data and analytics"
      }
    ];
  } else if (deptLower.includes('ece') || deptLower.includes('electronics')) {
    return [
      {
        name: "IoT Monitoring System",
        techStack: skills.slice(0, 3).length > 0 ? skills.slice(0, 3) : ["C++", "Python", "Arduino"],
        domain: "Internet of Things",
        impactScore: 80,
        description: "Real-time monitoring system using IoT sensors"
      }
    ];
  } else {
    return [
      {
        name: "Data Analysis Project",
        techStack: skills.slice(0, 3).length > 0 ? skills.slice(0, 3) : ["Python", "SQL"],
        domain: "Data Science",
        impactScore: 70,
        description: "Analysis and visualization of departmental data"
      }
    ];
  }
}

function getDefaultDomainsByDepartment(dept: string): string[] {
  const deptLower = dept.toLowerCase();
  
  if (deptLower.includes('cse') || deptLower.includes('computer')) {
    return ["Web Development", "Mobile App Development", "Data Science & Analytics", "Machine Learning & AI"];
  } else if (deptLower.includes('ai') || deptLower.includes('ml')) {
    return ["Machine Learning & AI", "Data Science & Analytics", "Research & Development"];
  } else if (deptLower.includes('ece') || deptLower.includes('electronics')) {
    return ["IoT & Embedded Systems", "Cybersecurity", "Research & Development"];
  } else if (deptLower.includes('it') || deptLower.includes('information')) {
    return ["Web Development", "Cloud Computing", "Cybersecurity", "Enterprise Software"];
  } else if (deptLower.includes('mech') || deptLower.includes('mechanical')) {
    return ["Research & Development", "IoT & Embedded Systems"];
  } else {
    return ["Research & Development", "Data Science & Analytics"];
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateStudentEnhancements();
}

export { populateStudentEnhancements };