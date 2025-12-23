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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user = new UserModel({
      id,
      ...insertUser,
      password: hashedPassword,
    });
    await user.save();
    return user.toObject() as User;
  }

  async getAllStudents(): Promise<Student[]> {
    const students = await StudentModel.find({}).lean();
    return students as Student[];
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const student = await StudentModel.findOne({ username }).lean();
    return student ? (student as Student) : undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student = new StudentModel({
      id,
      ...insertStudent,
    });
    await student.save();
    return student.toObject() as Student;
  }

  async updateStudent(username: string, data: UpdateStudent): Promise<Student | undefined> {
    const student = await StudentModel.findOneAndUpdate(
      { username },
      { $set: data },
      { new: true, lean: true }
    );
    return student ? (student as Student) : undefined;
  }

  /**
   * Update student analytics data (scraped from platforms)
   */
  async updateStudentAnalytics(
    username: string,
    analytics: {
      problemStats?: Student["problemStats"];
      contestStats?: Student["contestStats"];
      badges?: Student["badges"];
    }
  ): Promise<Student | undefined> {
    const updateData: any = {
      lastScrapedAt: new Date(),
    };

    if (analytics.problemStats) {
      updateData.problemStats = analytics.problemStats;
    }
    if (analytics.contestStats) {
      updateData.contestStats = analytics.contestStats;
    }
    if (analytics.badges) {
      updateData.badges = analytics.badges;
    }

    const student = await StudentModel.findOneAndUpdate(
      { username },
      { $set: updateData },
      { new: true, lean: true }
    );
    return student ? (student as Student) : undefined;
  }
}

