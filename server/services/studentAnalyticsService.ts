import type { Student, WeeklyActivity, DerivedScores } from "@shared/schema";
import { StudentModel } from "../models/Student";
import { WeeklySnapshotModel } from "../models/WeeklySnapshot";

/**
 * Service for calculating derived analytics for students
 */
export class StudentAnalyticsService {
  
  /**
   * Calculate weekly activity metrics for a student
   */
  static async calculateWeeklyActivity(studentId: string): Promise<WeeklyActivity> {
    const student = await StudentModel.findOne({ id: studentId });
    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get snapshots for comparison
    const recentSnapshots = await WeeklySnapshotModel.find({
      studentId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 });

    // Calculate problems solved in last 7 days
    const currentTotal = student.problemStats?.total || 0;
    const sevenDaySnapshot = recentSnapshots.find(s => 
      s.timestamp <= sevenDaysAgo
    );
    const problemsSolved7Days = currentTotal - (sevenDaySnapshot?.problemStats.total || currentTotal);

    // Calculate contests attended in last 30 days
    const contestsAttended30Days = this.calculateContestsInPeriod(student, thirtyDaysAgo);

    // Calculate rating growth in last 30 days
    const ratingGrowth30Days = this.calculateRatingGrowth(student, recentSnapshots);

    return {
      problemsSolved7Days: Math.max(0, problemsSolved7Days),
      contestsAttended30Days,
      ratingGrowth30Days,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate derived performance scores for a student
   */
  static calculateDerivedScores(student: Student): DerivedScores {
    const problemSolvingScore = this.calculateProblemSolvingScore(student);
    const contestStrengthScore = this.calculateContestStrengthScore(student);
    const consistencyScore = this.calculateConsistencyScore(student);
    const overallScore = Math.round((problemSolvingScore + contestStrengthScore + consistencyScore) / 3);

    return {
      problemSolvingScore,
      contestStrengthScore,
      consistencyScore,
      overallScore,
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Update weekly activity and derived scores for a student
   */
  static async updateStudentAnalytics(studentId: string): Promise<void> {
    const student = await StudentModel.findOne({ id: studentId });
    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const weeklyActivity = await this.calculateWeeklyActivity(studentId);
    const derivedScores = this.calculateDerivedScores(student);

    await StudentModel.updateOne(
      { id: studentId },
      {
        $set: {
          weeklyActivity,
          derivedScores
        }
      }
    );
  }

  /**
   * Bulk update analytics for all students
   */
  static async updateAllStudentAnalytics(): Promise<void> {
    const students = await StudentModel.find({}, { id: 1 });
    
    for (const student of students) {
      try {
        await this.updateStudentAnalytics(student.id);
      } catch (error) {
        console.error(`Failed to update analytics for student ${student.id}:`, error);
      }
    }
  }

  /**
   * Extract skills from resume text or project descriptions
   */
  static extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      // Programming Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
      // Frontend
      'React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Bootstrap',
      // Backend
      'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Laravel',
      // Databases
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'SQL',
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
      // Mobile
      'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS',
      // Data Science
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
      // Other
      'Firebase', 'GraphQL', 'REST API', 'Microservices', 'DSA', 'System Design'
    ];

    const foundSkills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );

    return [...new Set(foundSkills)]; // Remove duplicates
  }

  // Private helper methods
  private static calculateProblemSolvingScore(student: Student): number {
    const stats = student.problemStats;
    if (!stats) return 0;

    const total = stats.total || 0;
    const hard = stats.hard || 0;
    const medium = stats.medium || 0;

    // Weight harder problems more
    const weightedScore = (hard * 3) + (medium * 2) + (stats.easy || 0);
    
    // Normalize to 0-100 scale (assuming 500 weighted problems = 100 score)
    return Math.min(100, Math.round((weightedScore / 500) * 100));
  }

  private static calculateContestStrengthScore(student: Student): number {
    const contestStats = student.contestStats;
    if (!contestStats) return 0;

    const platforms = ['leetcode', 'codechef', 'codeforces'] as const;
    let totalRating = 0;
    let platformCount = 0;

    platforms.forEach(platform => {
      const stats = contestStats[platform];
      if (stats && stats.highestRating > 0) {
        totalRating += stats.highestRating;
        platformCount++;
      }
    });

    if (platformCount === 0) return 0;

    const avgRating = totalRating / platformCount;
    // Normalize rating to 0-100 scale (assuming 2000 rating = 100 score)
    return Math.min(100, Math.round((avgRating / 2000) * 100));
  }

  private static calculateConsistencyScore(student: Student): number {
    const stats = student.problemStats;
    if (!stats || !stats.solvedOverTime || stats.solvedOverTime.length < 2) return 0;

    const recentEntries = stats.solvedOverTime.slice(-12); // Last 12 entries
    if (recentEntries.length < 2) return 0;

    // Calculate consistency based on regular activity
    const intervals = [];
    for (let i = 1; i < recentEntries.length; i++) {
      const diff = recentEntries[i].count - recentEntries[i-1].count;
      intervals.push(diff);
    }

    const avgGrowth = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgGrowth, 2), 0) / intervals.length;
    
    // Lower variance = higher consistency
    const consistencyScore = Math.max(0, 100 - (variance * 2));
    return Math.round(consistencyScore);
  }

  private static calculateContestsInPeriod(student: Student, since: Date): number {
    const contestStats = student.contestStats;
    if (!contestStats) return 0;

    let totalContests = 0;
    const platforms = ['leetcode', 'codechef', 'codeforces'] as const;

    platforms.forEach(platform => {
      const stats = contestStats[platform];
      if (stats && stats.ratingHistory) {
        const recentContests = stats.ratingHistory.filter(entry => 
          new Date(entry.date) >= since
        );
        totalContests += recentContests.length;
      }
    });

    return totalContests;
  }

  private static calculateRatingGrowth(student: Student, snapshots: any[]): number {
    if (snapshots.length < 2) return 0;

    const latest = snapshots[0];
    const monthAgo = snapshots[snapshots.length - 1];

    const currentMaxRating = Math.max(
      latest.ratings?.leetcode || 0,
      latest.ratings?.codechef || 0,
      latest.ratings?.codeforces || 0
    );

    const pastMaxRating = Math.max(
      monthAgo.ratings?.leetcode || 0,
      monthAgo.ratings?.codechef || 0,
      monthAgo.ratings?.codeforces || 0
    );

    return currentMaxRating - pastMaxRating;
  }
}