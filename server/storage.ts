import { type User, type InsertUser, type Student, type InsertStudent, type UpdateStudent } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllStudents(): Promise<Student[]>;
  getStudentByUsername(username: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(username: string, data: UpdateStudent): Promise<Student | undefined>;
}

const departments = ["CSE", "ECE", "IT", "EEE", "MECH", "CIVIL"];
const avatarColors = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", 
  "bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"
];

const firstNames = [
  "Arun", "Bharath", "Chitra", "Deepak", "Esha", "Farhan", "Gokul", "Hari",
  "Indira", "Jayesh", "Karthik", "Lakshmi", "Mohan", "Nisha", "Om", "Priya",
  "Rahul", "Sanjay", "Tara", "Uma", "Vijay", "Yamini", "Zara", "Aditya",
  "Bhavana", "Chirag", "Divya", "Eshwar", "Fathima", "Ganesh", "Hemant",
  "Ishaan", "Jyoti", "Krishna", "Lavanya", "Madhav", "Neha", "Omkar", "Pallavi",
  "Ravi", "Sneha", "Tanvi", "Uday", "Varun", "Wafa", "Yash", "Ananya",
  "Bala", "Chandni", "Dhruv", "Ekta", "Firoz", "Gayathri", "Harini", "Irfan"
];

const lastNames = [
  "Kumar", "Sharma", "Patel", "Singh", "Reddy", "Nair", "Iyer", "Menon",
  "Rao", "Gupta", "Joshi", "Verma", "Pillai", "Das", "Roy", "Mehta",
  "Kapoor", "Srinivasan", "Mukherjee", "Chatterjee", "Banerjee", "Dutta"
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private students: Map<string, Student>;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.seedData();
  }

  private async seedData() {
    const hashedFacultyPassword = await bcrypt.hash("faculty123", 10);
    const hashedStudentPassword = await bcrypt.hash("student123", 10);

    for (let i = 1; i <= 3; i++) {
      const facultyUser: User = {
        id: `faculty-${i}`,
        username: `faculty${i}`,
        password: hashedFacultyPassword,
        role: "faculty",
      };
      this.users.set(facultyUser.id, facultyUser);
    }

    for (let i = 0; i < 54; i++) {
      const firstName = firstNames[i];
      const lastName = randomChoice(lastNames);
      const dept = randomChoice(departments);
      const username = `${firstName.toLowerCase()}${i + 1}`;
      const id = `student-${i + 1}`;

      const studentUser: User = {
        id: `user-student-${i + 1}`,
        username,
        password: hashedStudentPassword,
        role: "student",
      };
      this.users.set(studentUser.id, studentUser);

      const student: Student = {
        id,
        name: `${firstName} ${lastName}`,
        username,
        dept,
        regNo: `2021${dept}${String(i + 1).padStart(3, "0")}`,
        email: `${username}@college.edu`,
        linkedin: `https://linkedin.com/in/${username}`,
        github: `https://github.com/${username}`,
        resumeLink: `https://drive.google.com/resume-${username}`,
        mainAccounts: [
          { platform: "LeetCode", username: `${username}_lc` },
          { platform: "CodeForces", username: `${username}_cf` },
        ],
        subAccounts: [
          { platform: "CodeChef", username: `${username}_cc` },
          { platform: "GeeksforGeeks", username: `${username}_gfg` },
        ],
        avatarColor: randomChoice(avatarColors),
      };
      this.students.set(username, student);
    }

    console.log(`Seeded ${this.users.size} users and ${this.students.size} students`);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = { ...insertUser, id, password: hashedPassword };
    this.users.set(id, user);
    return user;
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    return this.students.get(username);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...insertStudent, id };
    this.students.set(student.username, student);
    return student;
  }

  async updateStudent(username: string, data: UpdateStudent): Promise<Student | undefined> {
    const student = this.students.get(username);
    if (!student) {
      return undefined;
    }

    const updatedStudent: Student = {
      ...student,
      ...data,
      username: student.username,
      id: student.id,
    };
    this.students.set(username, updatedStudent);
    return updatedStudent;
  }
}

export const storage = new MemStorage();
