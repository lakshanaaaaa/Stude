import type { User, InsertUser, Student, InsertStudent, UpdateStudent } from "@shared/schema";
import { UserModel } from "../models/User";
import { StudentModel } from "../models/Student";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import type { IStorage } from "../storage";

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).lean();
    return user ? (user as User) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    return user ? (user as User) : undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ googleId }).lean();
    return user ? (user as User) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    return user ? (user as User) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = insertUser.password ? await bcrypt.hash(insertUser.password, 10) : undefined;
    const user = new UserModel({
      _id: id,
      id,
      ...insertUser,
      password: hashedPassword,
      // Ensure onboarding flag exists in Mongo as well
      isOnboarded: false,
    });
    await user.save();
    return user.toObject() as User;
  }

  async getAllStudents(): Promise<Student[]> {
    const students = await StudentModel.find({});
    return students.map(s => {
      const studentObj = s.toObject();
      
      // Convert Map to plain object for platformStats
      if (studentObj.problemStats?.platformStats instanceof Map) {
        studentObj.problemStats.platformStats = Object.fromEntries(
          studentObj.problemStats.platformStats
        );
      }
      
      return studentObj as Student;
    });
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const student = await StudentModel.findOne({ username });
    if (!student) return undefined;
    
    const studentObj = student.toObject();
    
    // Convert Map to plain object for platformStats
    if (studentObj.problemStats?.platformStats instanceof Map) {
      studentObj.problemStats.platformStats = Object.fromEntries(
        studentObj.problemStats.platformStats
      );
    }
    
    return studentObj as Student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student = new StudentModel({
      _id: id,
      id,
      ...insertStudent,
    });
    await student.save();
    
    const studentObj = student.toObject();
    
    // Convert Map to plain object for platformStats
    if (studentObj.problemStats?.platformStats instanceof Map) {
      studentObj.problemStats.platformStats = Object.fromEntries(
        studentObj.problemStats.platformStats
      );
    }
    
    return studentObj as Student;
  }

  async updateStudent(username: string, data: UpdateStudent): Promise<Student | undefined> {
    const student = await StudentModel.findOneAndUpdate(
      { username },
      { $set: data },
      { new: true }
    );
    
    if (!student) return undefined;
    
    const studentObj = student.toObject();
    
    // Convert Map to plain object for platformStats
    if (studentObj.problemStats?.platformStats instanceof Map) {
      studentObj.problemStats.platformStats = Object.fromEntries(
        studentObj.problemStats.platformStats
      );
    }
    
    return studentObj as Student;
  }

  async updateStudentAnalytics(
    username: string,
    analytics: {
      problemStats?: Student["problemStats"];
      contestStats?: Student["contestStats"];
      badges?: Student["badges"];
    }
  ): Promise<Student | undefined> {
    // First get existing student to merge data
    const existingStudent = await StudentModel.findOne({ username }).lean() as Student | null;
    
    const updateData: any = {
      lastScrapedAt: new Date(),
    };

    console.log(`[MongoDB] Analytics updated: ${username}`);

    if (analytics.problemStats) {
      // Merge platform stats instead of replacing
      const existingPlatformStats = existingStudent?.problemStats?.platformStats;
      if (existingPlatformStats) {
        // Convert Map to plain object if needed
        let existingStatsObj: Record<string, number> = {};
        if (existingPlatformStats instanceof Map) {
          existingPlatformStats.forEach((value, key) => {
            existingStatsObj[key] = value;
          });
        } else {
          existingStatsObj = existingPlatformStats as Record<string, number>;
        }
        
        // Merge platform stats - only update if new value is greater than 0
        // This prevents overwriting existing data with 0 when only some platforms are scraped
        const mergedPlatformStats: Record<string, number> = { ...existingStatsObj };
        const newPlatformStats = analytics.problemStats.platformStats || {};
        
        for (const platform of Object.keys(newPlatformStats)) {
          const newValue = (newPlatformStats as Record<string, number>)[platform] || 0;
          const existingValue = mergedPlatformStats[platform] || 0;
          // Keep the higher value (in case of re-scrape with updated data)
          // or use new value if it's greater than 0
          if (newValue > 0) {
            mergedPlatformStats[platform] = Math.max(newValue, existingValue);
          }
        }
        
        // Recalculate total from merged platform stats
        const total = Object.values(mergedPlatformStats).reduce((sum: number, val: any) => sum + (val || 0), 0);
        
        updateData.problemStats = {
          ...analytics.problemStats,
          platformStats: mergedPlatformStats,
          total,
        };
      } else {
        updateData.problemStats = analytics.problemStats;
      }
    }
    
    if (analytics.contestStats) {
      // Merge contest stats instead of replacing
      if (existingStudent?.contestStats) {
        updateData.contestStats = {
          leetcode: analytics.contestStats.leetcode?.totalContests 
            ? analytics.contestStats.leetcode 
            : existingStudent.contestStats.leetcode,
          codechef: analytics.contestStats.codechef?.totalContests 
            ? analytics.contestStats.codechef 
            : existingStudent.contestStats.codechef,
          codeforces: analytics.contestStats.codeforces?.totalContests 
            ? analytics.contestStats.codeforces 
            : existingStudent.contestStats.codeforces,
        };
      } else {
        updateData.contestStats = analytics.contestStats;
      }
    }
    
    if (analytics.badges) {
      // Merge badges, avoiding duplicates
      if (existingStudent?.badges) {
        const existingIds = new Set(existingStudent.badges.map(b => b.id));
        const newBadges = analytics.badges.filter(b => !existingIds.has(b.id));
        updateData.badges = [...existingStudent.badges, ...newBadges];
      } else {
        updateData.badges = analytics.badges;
      }
    }

    const student = await StudentModel.findOneAndUpdate(
      { username },
      { $set: updateData },
      { new: true }
    );
    
    if (!student) return undefined;
    
    const studentObj = student.toObject();
    
    // Convert Map to plain object for platformStats
    if (studentObj.problemStats?.platformStats instanceof Map) {
      studentObj.problemStats.platformStats = Object.fromEntries(
        studentObj.problemStats.platformStats
      );
    }
    
    return studentObj as Student;
  }

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    const users = await UserModel.find({}).select("-password").lean();
    return users as Omit<User, "password">[];
  }

  async updateUser(id: string, data: Partial<Omit<User, "id" | "password">>): Promise<User | undefined> {
    const user = await UserModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true, lean: true }
    );
    return user ? (user as User) : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async deleteStudent(username: string): Promise<boolean> {
    const result = await StudentModel.deleteOne({ username });
    return result.deletedCount > 0;
  }
}



