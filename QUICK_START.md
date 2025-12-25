# Quick Start Guide: Profile Scraper

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/student-analytics
SESSION_SECRET=your-secret-key-here
```

### Step 3: Start the Server
```bash
npm run dev
```

### Step 4: Test Scraping
```bash
# Test with sample data
npm run test:scrape
```

## 📝 Add Platform IDs for a Student

### Option 1: During Onboarding
When a student signs up, they can add their platform usernames:
```typescript
{
  leetcode: "john_doe",
  codechef: "john_chef",
  codeforces: "johncf"
}
```

### Option 2: Edit Profile
Students can update their mainAccounts in the profile edit page:
```typescript
mainAccounts: [
  { platform: "LeetCode", username: "john_doe" },
  { platform: "CodeChef", username: "john_chef" },
  { platform: "CodeForces", username: "johncf" }
]
```

### Option 3: Direct Database Update
```javascript
// MongoDB shell or script
db.students.updateOne(
  { username: "john_doe" },
  {
    $set: {
      mainAccounts: [
        { platform: "LeetCode", username: "john_doe" },
        { platform: "CodeChef", username: "john_chef" },
        { platform: "CodeForces", username: "johncf" }
      ]
    }
  }
);
```

## 🔄 Scrape Data

### Method 1: UI Button (Recommended)
1. Navigate to student profile: `/student/john_doe`
2. Click "Update Data" button
3. Wait for success notification
4. View updated statistics

### Method 2: API Call
```bash
curl -X POST http://localhost:5000/api/student/john_doe/scrape \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Method 3: Bulk Scraping Script
```bash
# Scrape all students in database
npm run db:scrape
```

## 📊 View Results

### In the UI:
1. Go to `/student/username`
2. See:
   - Problem Stats Card (total, easy, medium, hard)
   - Contest Stats Card (rating, contests)
   - Badge Grid (achievements)

### In the Database:
```javascript
// MongoDB query
db.students.findOne({ username: "john_doe" }, {
  problemStats: 1,
  contestStats: 1,
  badges: 1,
  lastScrapedAt: 1
});
```

### Via API:
```bash
curl http://localhost:5000/api/student/john_doe \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🧪 Testing

### Test Individual Scrapers:
```typescript
// server/scripts/testScraping.ts
import { scrapeLeetCode } from "../scrapers/leetcode";
import { scrapeCodeChef } from "../scrapers/codechef";
import { scrapeCodeForces } from "../scrapers/codeforces";

// Test LeetCode
const leetcodeData = await scrapeLeetCode("tourist");
console.log(leetcodeData);

// Test CodeChef
const codechefData = await scrapeCodeChef("tourist");
console.log(codechefData);

// Test Codeforces
const codeforcesData = await scrapeCodeForces("tourist");
console.log(codeforcesData);
```

### Run Full Test Suite:
```bash
npm run test:scrape
```

## 🐛 Troubleshooting

### Issue: Scraping Returns Empty Data
**Solution:**
- Verify platform username is correct
- Check if profile is public
- Test API endpoint manually:
  ```bash
  # LeetCode
  curl https://leetcode.com/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"query{matchedUser(username:\"tourist\"){username}}"}'
  
  # Codeforces
  curl https://codeforces.com/api/user.info?handles=tourist
  ```

### Issue: Rate Limiting
**Solution:**
- Increase delay in `server/scrapers/index.ts`:
  ```typescript
  await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds
  ```

### Issue: MongoDB Connection Failed
**Solution:**
- Check MongoDB is running: `mongosh`
- Verify MONGODB_URI in .env
- Check network connectivity

### Issue: Authentication Error
**Solution:**
- Ensure token is valid
- Check Authorization header format: `Bearer <token>`
- Verify user has permission to scrape profile

## 📚 API Reference

### Scrape Student Data
```http
POST /api/student/:username/scrape
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "student": {
    "username": "john_doe",
    "problemStats": {
      "total": 450,
      "easy": 200,
      "medium": 180,
      "hard": 70,
      "platformStats": {
        "LeetCode": 300,
        "CodeChef": 80,
        "CodeForces": 70
      }
    },
    "contestStats": {
      "currentRating": 1850,
      "highestRating": 1920,
      "totalContests": 45
    },
    "badges": [
      {
        "id": "leetcode-master-john_doe",
        "name": "Master",
        "platform": "LeetCode",
        "icon": "🥇",
        "level": 4
      }
    ],
    "lastScrapedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Profile data scraped and updated successfully"
}
```

### Get Student Profile
```http
GET /api/student/:username
Authorization: Bearer <token>
```

## 🎯 Common Use Cases

### 1. New Student Onboarding
```typescript
// After signup, student adds platform IDs
POST /api/auth/onboard
{
  "leetcode": "john_doe",
  "codechef": "john_chef",
  "codeforces": "johncf"
}

// Automatically trigger first scrape
POST /api/student/john_doe/scrape
```

### 2. Daily Data Refresh
```typescript
// Cron job (future enhancement)
// Every day at 2 AM, scrape all students
cron.schedule('0 2 * * *', async () => {
  const students = await storage.getAllStudents();
  for (const student of students) {
    await scrapeAndUpdate(student.username);
  }
});
```

### 3. Department Analytics
```typescript
// Get all students in CSE department
const cseStudents = await storage.getAllStudents();
const filtered = cseStudents.filter(s => s.dept === "CSE");

// Calculate average rating
const avgRating = filtered.reduce((sum, s) => 
  sum + (s.contestStats?.currentRating || 0), 0
) / filtered.length;
```

## 🎉 You're Ready!

Your scraping system is now fully configured and ready to use. Start by:
1. Adding platform usernames for students
2. Clicking "Update Data" on profile pages
3. Viewing the scraped statistics

For more details, see:
- `SCRAPER_README.md` - Comprehensive documentation
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `ARCHITECTURE_DIAGRAM.md` - System architecture
