import type { Student, StudentAnalytics, ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

const avatarColors = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", 
  "bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

// --------------------------------------------
// REAL STUDENT DATA
// --------------------------------------------
const realStudents = [
  { name: "Aadhisankar A", dept: "CSE" },
  { name: "Aagnesh Shifak", dept: "AI&DS" },
  { name: "Aakash M", dept: "CSE" },
  { name: "Ahamed Ammar A", dept: "CSBS" },
  { name: "Ayishathul Hazeena S", dept: "CSBS" },
  { name: "Blessan Corley A", dept: "AI&DS" },
  { name: "Dhaanish Nihaal M", dept: "CSE(AI&ML)" },
  { name: "Dhanyathaa M", dept: "CSE(AI&ML)" },
  { name: "Dharaneesh S K", dept: "AI&DS" },
  { name: "Dhinakaran MS", dept: "CSE(AI&ML)" },
  { name: "Dinesh Madhavan M", dept: "AI&DS" },
  { name: "Dinesh S", dept: "CSBS" },
  { name: "Divyadharshini M", dept: "CSBS" },
  { name: "David Vensilin R", dept: "CSE(AI&ML)" },
  { name: "Gowsika", dept: "CSBS" },
  { name: "Harini C", dept: "AI&DS" },
  { name: "Harishwar R", dept: "CSE(AI&ML)" },
  { name: "Karthick M", dept: "CSE(AI&ML)" },
  { name: "Kaviya K", dept: "CSBS" },
  { name: "Lakshana S", dept: "CSBS" },
  { name: "Logesh", dept: "AI&DS" },
  { name: "Mannam Ganesh Babu", dept: "AI&DS" },
  { name: "Mohanraj S", dept: "CSE(AI&ML)" },
  { name: "Mohamed Asharaf S", dept: "AI&DS" },
  { name: "Nizath Mohammed M", dept: "AI&DS" },
  { name: "Padmadev D", dept: "CSE" },
  { name: "Pandiharshan K", dept: "CSE(AI&ML)" },
  { name: "Pawan R", dept: "AI&DS" },
  { name: "Prakash B", dept: "CSBS" },
  { name: "Pranav P", dept: "AI&DS" },
  { name: "Prasanna Venkataraman S", dept: "AI&DS" },
  { name: "Raga T", dept: "CSE(AI&ML)" },
  { name: "Ragul VL", dept: "AI&DS" },
  { name: "Rajadurai R", dept: "CSBS" },
  { name: "Robert Mithran N", dept: "CSBS" },
  { name: "Sabari Yuhendhran M", dept: "CSBS" },
  { name: "Sanjaiveeran S", dept: "CSE(AI&ML)" },
  { name: "Santhosh KV", dept: "CSE" },
  { name: "Sarikaa Shree V", dept: "CSE(AI&ML)" },
  { name: "Sharvesh L", dept: "CSBS" },
  { name: "Shanmugam A", dept: "CSE(AI&ML)" },
  { name: "Siby R", dept: "CSE" },
  { name: "Sobhika P M", dept: "CSBS" },
  { name: "Sowmiya S R", dept: "CSBS" },
  { name: "Sri Vishnu Vathan S", dept: "AI&DS" },
  { name: "Sridharan I", dept: "CSE(AI&ML)" },
  { name: "Steepan P", dept: "AI&DS" },
  { name: "Vijay", dept: "CSE(AI&ML)" },
  { name: "Vijesh A", dept: "AI&DS" },
  { name: "Vinoth Kumar M", dept: "AI&DS" },
  { name: "Vishwa D", dept: "AI&DS" },
  { name: "Dhavamani A", dept: "CSE" }
];

// -------------------------------------------------
// FIX 1: generateStudents() → REAL STUDENTS
// -------------------------------------------------
export function generateStudents(): Student[] {
  return realStudents.map((s, index) => {
    const username = makeUsername(s.name);

    return {
      id: `student-${index + 1}`,
      name: s.name,
      username,
      dept: s.dept,
      regNo: `2021${String(index + 1).padStart(3, "0")}`,
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
  });
}

// -------------------------------------------------
// FIX 2: generateStudentAnalytics() → KEEP SAME
// -------------------------------------------------
export function generateProblemStats(): ProblemStats {
  const easy = Math.floor(Math.random() * 200) + 50;
  const medium = Math.floor(Math.random() * 150) + 30;
  const hard = Math.floor(Math.random() * 50) + 10;

  return {
    total: easy + medium + hard,
    easy,
    medium,
    hard,
    platformStats: {
      LeetCode: Math.floor(Math.random() * 150) + 50,
      CodeChef: Math.floor(Math.random() * 80) + 20,
      CodeForces: Math.floor(Math.random() * 100) + 30,
      GeeksforGeeks: Math.floor(Math.random() * 60) + 15,
      HackerRank: Math.floor(Math.random() * 50) + 10,
      CodeStudio: Math.floor(Math.random() * 40) + 5,
    },
    solvedOverTime: [],
  };
}

export function generateContestStats(): ContestStats {
  return {
    currentRating: 1500,
    highestRating: 1700,
    totalContests: 20,
    ratingHistory: [],
  };
}

export function generateBadges(): Badge[] {
  return [];
}

export function generateStudentAnalytics(): StudentAnalytics {
  return {
    problemStats: generateProblemStats(),
    contestStats: generateContestStats(),
    badges: generateBadges(),
  };
}

export function getTopCoder(students: Student[]): Student | undefined {
  if (!students || students.length === 0) return undefined;
  return students[Math.floor(Math.random() * students.length)];
}

