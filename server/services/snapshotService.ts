import { storage } from "../storage";
import { WeeklySnapshotModel, type WeeklySnapshot } from "../models/WeeklySnapshot";
import { randomUUID } from "crypto";

/**
 * Creates a daily snapshot of all student statistics
 * This snapshot is used to calculate weekly deltas for Topper of the Week
 */
export async function createDailySnapshot(): Promise<{ snapshotsCreated: number; errors: number; timestamp: Date }> {
  try {
    const students = await storage.getAllStudents();
    const timestamp = new Date();
    let snapshotsCreated = 0;
    let errors = 0;

    for (const student of students) {
      try {
        const snapshot: WeeklySnapshot = {
          id: randomUUID(),
          studentId: student.id,
          username: student.username,
          timestamp,
          
          problemStats: {
            leetcode: student.problemStats?.platformStats?.LeetCode || 0,
            codechef: student.problemStats?.platformStats?.CodeChef || 0,
            codeforces: student.problemStats?.platformStats?.CodeForces || 0,
            total: student.problemStats?.total || 0,
          },
          
          ratings: {
            leetcode: student.contestStats?.leetcode?.currentRating || 0,
            codechef: student.contestStats?.codechef?.currentRating || 0,
            codeforces: student.contestStats?.codeforces?.currentRating || 0,
          },
          
          contests: {
            leetcode: student.contestStats?.leetcode?.totalContests || 0,
            codechef: student.contestStats?.codechef?.totalContests || 0,
            codeforces: student.contestStats?.codeforces?.totalContests || 0,
          },
        };

        await WeeklySnapshotModel.create({
          _id: snapshot.id,
          ...snapshot,
        });
        
        snapshotsCreated++;
      } catch (err) {
        console.error(`[Snapshot] Failed to create snapshot for ${student.username}:`, err);
        errors++;
      }
    }

    console.log(`[Snapshot] Created ${snapshotsCreated} snapshots at ${timestamp.toISOString()}`);
    return { snapshotsCreated, errors, timestamp };
  } catch (error) {
    console.error("[Snapshot] Failed to create daily snapshot:", error);
    throw error;
  }
}

/**
 * Gets the baseline snapshot for a student from N days ago
 * Falls back to closest snapshot within N+1 days if exact match not found
 */
export async function getBaselineSnapshot(
  studentId: string,
  daysAgo: number = 7
): Promise<WeeklySnapshot | null> {
  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    targetDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(targetDate);
    maxDate.setDate(maxDate.getDate() + 1);

    // Try to find snapshot from exactly N days ago (within 24-hour window)
    let snapshot = await WeeklySnapshotModel.findOne({
      studentId,
      timestamp: {
        $gte: targetDate,
        $lt: maxDate,
      },
    })
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    // If not found, try to find closest snapshot within N+1 days
    if (!snapshot) {
      const fallbackDate = new Date(targetDate);
      fallbackDate.setDate(fallbackDate.getDate() - 1);

      snapshot = await WeeklySnapshotModel.findOne({
        studentId,
        timestamp: {
          $gte: fallbackDate,
          $lt: maxDate,
        },
      })
        .sort({ timestamp: -1 })
        .lean()
        .exec();
    }

    return snapshot as WeeklySnapshot | null;
  } catch (error) {
    console.error(`[Snapshot] Failed to get baseline for student ${studentId}:`, error);
    return null;
  }
}

/**
 * Gets the most recent snapshot for a student
 */
export async function getCurrentSnapshot(studentId: string): Promise<WeeklySnapshot | null> {
  try {
    const snapshot = await WeeklySnapshotModel.findOne({ studentId })
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    return snapshot as WeeklySnapshot | null;
  } catch (error) {
    console.error(`[Snapshot] Failed to get current snapshot for student ${studentId}:`, error);
    return null;
  }
}

/**
 * Cleans up old snapshots (older than 30 days)
 * Note: TTL index should handle this automatically, but this is a manual fallback
 */
export async function cleanupOldSnapshots(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await WeeklySnapshotModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(`[Snapshot] Cleaned up ${result.deletedCount} old snapshots`);
    return result.deletedCount;
  } catch (error) {
    console.error("[Snapshot] Failed to cleanup old snapshots:", error);
    return 0;
  }
}
