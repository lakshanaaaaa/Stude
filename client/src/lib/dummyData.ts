import type { Student, StudentAnalytics, ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

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

function generateUsername(firstName: string, index: number): string {
  return `${firstName.toLowerCase()}${index + 1}`;
}

export function generateStudents(): Student[] {
  const students: Student[] = [];
  
  for (let i = 0; i < 54; i++) {
    const firstName = firstNames[i];
    const lastName = randomChoice(lastNames);
    const dept = randomChoice(departments);
    const username = generateUsername(firstName, i);
    
    students.push({
      id: `student-${i + 1}`,
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
    });
  }
  
  return students;
}

export function generateProblemStats(): ProblemStats {
  const easy = Math.floor(Math.random() * 200) + 50;
  const medium = Math.floor(Math.random() * 150) + 30;
  const hard = Math.floor(Math.random() * 50) + 10;
  
  const solvedOverTime: { date: string; count: number }[] = [];
  let cumulative = 0;
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    cumulative += Math.floor(Math.random() * 30) + 5;
    solvedOverTime.push({
      date: date.toISOString().slice(0, 7),
      count: cumulative,
    });
  }
  
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
    solvedOverTime,
  };
}

export function generateContestStats(): ContestStats {
  const highestRating = Math.floor(Math.random() * 1000) + 1200;
  const currentRating = highestRating - Math.floor(Math.random() * 200);
  
  const ratingHistory: { date: string; rating: number; platform: CodingPlatform }[] = [];
  const now = new Date();
  let rating = 1000;
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    rating += Math.floor(Math.random() * 100) - 30;
    rating = Math.max(800, Math.min(rating, highestRating));
    
    ratingHistory.push({
      date: date.toISOString().slice(0, 7),
      rating,
      platform: randomChoice(["LeetCode", "CodeForces", "CodeChef"] as CodingPlatform[]),
    });
  }
  
  return {
    currentRating,
    highestRating,
    totalContests: Math.floor(Math.random() * 50) + 10,
    ratingHistory,
  };
}

export function generateBadges(): Badge[] {
  const badgeTypes = [
    { name: "Problem Solver", icon: "target" },
    { name: "Contest Master", icon: "trophy" },
    { name: "Streak Keeper", icon: "flame" },
    { name: "Early Bird", icon: "sun" },
    { name: "Night Owl", icon: "moon" },
    { name: "Speed Demon", icon: "zap" },
  ];
  
  const platforms: CodingPlatform[] = ["LeetCode", "CodeForces", "CodeChef", "GeeksforGeeks"];
  const badges: Badge[] = [];
  
  platforms.forEach((platform) => {
    const numBadges = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numBadges; i++) {
      const badgeType = randomChoice(badgeTypes);
      badges.push({
        id: `${platform}-${badgeType.name}-${i}`,
        name: badgeType.name,
        platform,
        icon: badgeType.icon,
        level: Math.floor(Math.random() * 3) + 1,
      });
    }
  });
  
  return badges;
}

export function generateStudentAnalytics(): StudentAnalytics {
  return {
    problemStats: generateProblemStats(),
    contestStats: generateContestStats(),
    badges: generateBadges(),
  };
}

// Get top coder (student with highest rating)
export function getTopCoder(students: Student[]): Student | undefined {
  if (students.length === 0) return undefined;
  return students[Math.floor(Math.random() * Math.min(5, students.length))];
}
