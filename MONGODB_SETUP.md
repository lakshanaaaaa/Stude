# MongoDB Setup & Scraping Guide

## 📋 Prerequisites

1. **MongoDB Installation**
   - Install MongoDB locally, OR
   - Use MongoDB Atlas (cloud) - free tier available

2. **MongoDB Connection String**
   - Local: `mongodb://localhost:27017/studentperfanalytics`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/studentperfanalytics`

## 🚀 Setup Steps

### Step 1: Set Environment Variable

Create a `.env` file in the project root (or set environment variable):

```bash
MONGODB_URI=mongodb://localhost:27017/studentperfanalytics
```

Or for MongoDB Atlas:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studentperfanalytics
```

### Step 2: Seed Database

Run the seed script to create users and students:

```bash
npm run db:seed
```

This will:
- Create 3 faculty accounts
- Create 54 student accounts with default usernames

### Step 3: Prepare Username Mappings

Create a file named `usernames.json` in the project root with the following format:

```json
[
  {
    "username": "aadhisankara",
    "leetcode": "actual_leetcode_username_here",
    "codechef": "actual_codechef_username_here"
  },
  {
    "username": "aagneshshifak",
    "leetcode": "another_leetcode_username",
    "codechef": "another_codechef_username"
  }
  // ... add all 54 students
]
```

**Important Notes:**
- `username` must match the student's username in the database (e.g., "aadhisankara")
- `leetcode` and `codechef` are optional - provide only the ones you have
- You can provide just LeetCode, just CodeChef, or both

### Step 4: Update Usernames and Scrape Data

Run the scraping script:

```bash
npm run db:update-scrape
```

Or specify a custom JSON file:

```bash
tsx server/scripts/inputUsernames.ts your-custom-file.json
```

This will:
1. Update student usernames in the database
2. Scrape LeetCode and CodeChef data for each student
3. Store analytics (problem stats, contest ratings, badges) in MongoDB

### Step 5: Verify Data

Start the server and check the student profiles:

```bash
npm run dev
```

Visit `http://localhost:5005` and log in to see the scraped data.

## 📊 What Gets Scraped

### LeetCode
- Total problems solved
- Easy/Medium/Hard breakdown
- Contest rating
- Rating history
- Badges (based on rating tiers)

### CodeChef
- Problems solved
- Contest rating
- Star rating (1-7 stars)
- Badges

## 🔄 Re-scraping Data

To update data for all students:

```bash
npm run db:scrape
```

This will scrape data for all students using their current usernames in the database.

## 🛠️ Troubleshooting

### MongoDB Connection Issues

1. **Local MongoDB not running:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

2. **Connection string incorrect:**
   - Verify your MongoDB URI
   - Check if MongoDB is accessible
   - For Atlas, ensure your IP is whitelisted

### Scraping Issues

1. **Rate Limiting:**
   - The script includes delays between requests
   - If you get blocked, wait and try again later

2. **Invalid Usernames:**
   - Verify usernames are correct
   - Some profiles may be private or not exist

3. **Network Errors:**
   - Check your internet connection
   - Some platforms may block automated requests

## 📝 Example usernames.json

```json
[
  {
    "username": "aadhisankara",
    "leetcode": "aadhisankar",
    "codechef": "aadhisankar"
  },
  {
    "username": "aagneshshifak",
    "leetcode": "aagnesh",
    "codechef": "aagnesh_shifak"
  }
]
```

## 🔐 Default Login Credentials

**Faculty:**
- Username: `mahalakshmi` / Password: `faculty123`
- Username: `sachin` / Password: `faculty123`
- Username: `lakshanaad` / Password: `faculty123`

**Students:**
- Username: `aadhisankara` / Password: `student123`
- (Same pattern for all 54 students)





