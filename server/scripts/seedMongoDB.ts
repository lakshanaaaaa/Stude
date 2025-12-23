import { config } from "dotenv";
config(); // Load .env file

import { connectMongoDB } from "../db/mongodb";
import { MongoStorage } from "../storage/mongodb";
import { UserModel } from "../models/User";
import { StudentModel } from "../models/Student";
import bcrypt from "bcrypt";
import type { User, Student } from "@shared/schema";

const avatarColors = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedMongoDB() {
  await connectMongoDB();
  const storage = new MongoStorage();

  console.log("🌱 Seeding MongoDB database...\n");

  // Clear existing data (optional - comment out if you want to keep existing data)
  await UserModel.deleteMany({});
  await StudentModel.deleteMany({});
  console.log("✅ Cleared existing data\n");

  // Seed Faculty
  const facultyList = [
    { name: "Dr. MahaLakshmi", username: "mahalakshmi", password: "faculty123", dept: "CTP" },
    { name: "Sachin Nandha Sabarish", username: "sachin", password: "faculty123", dept: "CTP" },
    { name: "LakshanaAd", username: "lakshanaad", password: "faculty123", dept: "CTP" }
  ];

  for (let i = 0; i < facultyList.length; i++) {
    const f = facultyList[i];
    const hashedPassword = await bcrypt.hash(f.password, 10);

    const facultyUser: User = {
      id: `faculty-${i + 1}`,
      username: f.username,
      password: hashedPassword,
      role: "faculty",
    };

    await storage.createUser(facultyUser);
    console.log(`✅ Created faculty: ${f.username}`);
  }

  // Seed Students
  const studentList = [
    { name: "Aadhisankar A", dept: "CSE", username: "aadhisankara", password: "student123" },
    { name: "Aagnesh Shifak", dept: "AI&DS", username: "aagneshshifak", password: "student123" },
    { name: "Aakash M", dept: "CSE", username: "aakashm", password: "student123" },
    { name: "Ahamed Ammar A", dept: "CSBS", username: "ahamedammara", password: "student123" },
    { name: "Ayishathul Hazeena S", dept: "CSBS", username: "ayishathulhazeenas", password: "student123" },
    { name: "Blessan Corley A", dept: "AI&DS", username: "blessancorleya", password: "student123" },
    { name: "Dhaanish Nihaal M", dept: "CSE(AI&ML)", username: "dhaanishnihaalm", password: "student123" },
    { name: "Dhanyathaa M", dept: "CSE(AI&ML)", username: "dhanyathaam", password: "student123" },
    { name: "Dharaneesh S K", dept: "AI&DS", username: "dharaneeshsk", password: "student123" },
    { name: "Dhinakaran MS", dept: "CSE(AI&ML)", username: "dhinakaranms", password: "student123" },
    { name: "Dinesh Madhavan M", dept: "AI&DS", username: "dineshmadhavanm", password: "student123" },
    { name: "Dinesh S", dept: "CSBS", username: "dineshs", password: "student123" },
    { name: "Divyadharshini M", dept: "CSBS", username: "divyadharshinim", password: "student123" },
    { name: "David Vensilin R", dept: "CSE(AI&ML)", username: "davidvensilinr", password: "student123" },
    { name: "Gowsika", dept: "CSBS", username: "gowsika", password: "student123" },
    { name: "Harini C", dept: "AI&DS", username: "harinic", password: "student123" },
    { name: "Harishwar R", dept: "CSE(AI&ML)", username: "harishwarr", password: "student123" },
    { name: "Karthick M", dept: "CSE(AI&ML)", username: "karthickm", password: "student123" },
    { name: "Kaviya K", dept: "CSBS", username: "kaviyak", password: "student123" },
    { name: "Lakshana S", dept: "CSBS", username: "lakshanas", password: "student123" },
    { name: "Logesh", dept: "AI&DS", username: "logesh", password: "student123" },
    { name: "Mannam Ganesh Babu", dept: "AI&DS", username: "mannamganeshbabu", password: "student123" },
    { name: "Mohanraj S", dept: "CSE(AI&ML)", username: "mohanrajs", password: "student123" },
    { name: "Mohamed Asharaf S", dept: "AI&DS", username: "mohamedasharafs", password: "student123" },
    { name: "Nizath Mohammed M", dept: "AI&DS", username: "nizathmohammedm", password: "student123" },
    { name: "Padmadev D", dept: "CSE", username: "padmadevd", password: "student123" },
    { name: "Pandiharshan K", dept: "CSE(AI&ML)", username: "pandiharshank", password: "student123" },
    { name: "Pawan R", dept: "AI&DS", username: "pawanr", password: "student123" },
    { name: "Prakash B", dept: "CSBS", username: "prakashb", password: "student123" },
    { name: "Pranav P", dept: "AI&DS", username: "pranavp", password: "student123" },
    { name: "Prasanna Venkataraman S", dept: "AI&DS", username: "prasannavenkataramans", password: "student123" },
    { name: "Raga T", dept: "CSE(AI&ML)", username: "ragat", password: "student123" },
    { name: "Ragul VL", dept: "AI&DS", username: "ragulvl", password: "student123" },
    { name: "Rajadurai R", dept: "CSBS", username: "rajadurair", password: "student123" },
    { name: "Robert Mithran N", dept: "CSBS", username: "robertmithrann", password: "student123" },
    { name: "Sabari Yuhendhran M", dept: "CSBS", username: "sabariyuhendhranm", password: "student123" },
    { name: "Sanjaiveeran S", dept: "CSE(AI&ML)", username: "sanjaiveerans", password: "student123" },
    { name: "Santhosh KV", dept: "CSE", username: "santhoshkv", password: "student123" },
    { name: "Sarikaa Shree V", dept: "CSE(AI&ML)", username: "sarikaashreev", password: "student123" },
    { name: "Sharvesh L", dept: "CSBS", username: "sharveshl", password: "student123" },
    { name: "Shanmugam A", dept: "CSE(AI&ML)", username: "shanmugama", password: "student123" },
    { name: "Siby R", dept: "CSE", username: "sibyr", password: "student123" },
    { name: "Sobhika P M", dept: "CSBS", username: "sobhikapm", password: "student123" },
    { name: "Sowmiya S R", dept: "CSBS", username: "sowmiyasr", password: "student123" },
    { name: "Sri Vishnu Vathan S", dept: "AI&DS", username: "srivishnuvathans", password: "student123" },
    { name: "Sridharan I", dept: "CSE(AI&ML)", username: "sridharani", password: "student123" },
    { name: "Steepan P", dept: "AI&DS", username: "steepanp", password: "student123" },
    { name: "Vijay", dept: "CSE(AI&ML)", username: "vijay", password: "student123" },
    { name: "Vijesh A", dept: "AI&DS", username: "vijesha", password: "student123" },
    { name: "Vinoth Kumar M", dept: "AI&DS", username: "vinothkumarm", password: "student123" },
    { name: "Vishwa D", dept: "AI&DS", username: "vishwad", password: "student123" },
    { name: "Dhavamani A", dept: "CSE", username: "dhavamaniam", password: "student123" }
  ];

  for (let i = 0; i < studentList.length; i++) {
    const s = studentList[i];
    const id = `student-${i + 1}`;
    const hashedPassword = await bcrypt.hash(s.password, 10);

    // Create user
    const user: User = {
      id: `user-student-${i + 1}`,
      username: s.username,
      password: hashedPassword,
      role: "student",
    };
    await storage.createUser(user);

    // Create student
    const student: Student = {
      id,
      name: s.name,
      username: s.username,
      dept: s.dept,
      regNo: `2021${String(i + 1).padStart(3, "0")}`,
      email: `${s.username}@college.edu`,
      linkedin: `https://linkedin.com/in/${s.username}`,
      github: `https://github.com/${s.username}`,
      resumeLink: `https://drive.google.com/resume-${s.username}`,
      mainAccounts: [
        { platform: "LeetCode", username: `${s.username}_lc` },
        { platform: "CodeForces", username: `${s.username}_cf` },
      ],
      subAccounts: [
        { platform: "CodeChef", username: `${s.username}_cc` },
        { platform: "GeeksforGeeks", username: `${s.username}_gfg` },
      ],
      avatarColor: randomChoice(avatarColors),
    };

    await storage.createStudent(student);
    console.log(`✅ Created student: ${s.name} (${s.username})`);
  }

  console.log(`\n✨ Seeded ${facultyList.length} faculty and ${studentList.length} students`);
}

// Run if called directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes("seedMongoDB")) {
  seedMongoDB()
    .then(() => {
      console.log("\n✨ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fatal error:", error);
      process.exit(1);
    });
}

