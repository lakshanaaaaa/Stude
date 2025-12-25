# 🚀 MongoDB Setup & Scraping Instructions

## ✅ What Has Been Set Up

I've successfully set up:

1. ✅ **MongoDB Integration**
   - Mongoose models for User and Student
   - MongoDB storage implementation
   - Automatic fallback to in-memory storage if MongoDB unavailable

2. ✅ **Web Scrapers**
   - LeetCode scraper (GraphQL API)
   - CodeChef scraper (HTML parsing)
   - Combined scraper that merges data from both platforms

3. ✅ **Database Scripts**
   - `npm run db:seed` - Seed database with 54 students and 3 faculty
   - `npm run db:scrape` - Scrape data for all students
   - `npm run db:update-scrape` - Update usernames and scrape

4. ✅ **Updated Schema**
   - Student schema now includes `problemStats`, `contestStats`, and `badges`
   - Frontend updated to display scraped analytics

## 📋 What I Need From You

### 1. MongoDB Connection String

**Option A: Local MongoDB**
- Install MongoDB: https://www.mongodb.com/try/download/community
- Start MongoDB service
- Connection string: `mongodb://localhost:27017/studentperfanalytics`

**Option B: MongoDB Atlas (Cloud - Recommended)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/studentperfanalytics`

### 2. Student Usernames (54 students)

Create a file `usernames.json` in the project root with this format:

```json
[
  {
    "username": "aadhisankara",
    "leetcode": "actual_leetcode_username",
    "codechef": "actual_codechef_username"
  },
  {
    "username": "aagneshshifak",
    "leetcode": "another_leetcode_username",
    "codechef": "another_codechef_username"
  }
  // ... continue for all 54 students
]
```

**Important:**
- `username` must match the student's username in the database (see list below)
- `leetcode` and `codechef` are optional - provide what you have
- You can provide just LeetCode, just CodeChef, or both

## 📝 Complete Student List (for reference)

Here are all 54 students' usernames you'll need to map:

1. aadhisankara
2. aagneshshifak
3. aakashm
4. ahamedammara
5. ayishathulhazeenas
6. blessancorleya
7. dhaanishnihaalm
8. dhanyathaam
9. dharaneeshsk
10. dhinakaranms
11. dineshmadhavanm
12. dineshs
13. divyadharshinim
14. davidvensilinr
15. gowsika
16. harinic
17. harishwarr
18. karthickm
19. kaviyak
20. lakshanas
21. logesh
22. mannamganeshbabu
23. mohanrajs
24. mohamedasharafs
25. nizathmohammedm
26. padmadevd
27. pandiharshank
28. pawanr
29. prakashb
30. pranavp
31. prasannavenkataramans
32. ragat
33. ragulvl
34. rajadurair
35. robertmithrann
36. sabariyuhendhranm
37. sanjaiveerans
38. santhoshkv
39. sarikaashreev
40. sharveshl
41. shanmugama
42. sibyr
43. sobhikapm
44. sowmiyasr
45. srivishnuvathans
46. sridharani
47. steepanp
48. vijay
49. vijesha
50. vinothkumarm
51. vishwad
52. dhavamaniam

## 🎯 Step-by-Step Setup

### Step 1: Set MongoDB Connection

Create `.env` file in project root:

```bash
MONGODB_URI=mongodb://localhost:27017/studentperfanalytics
```

Or for Atlas:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studentperfanalytics
```

### Step 2: Seed Database

```bash
npm run db:seed
```

This creates all users and students in MongoDB.

### Step 3: Create usernames.json

Create `usernames.json` with all 54 students' LeetCode and CodeChef usernames.

### Step 4: Update & Scrape

```bash
npm run db:update-scrape
```

This will:
- Update usernames in database
- Scrape LeetCode and CodeChef for each student
- Store analytics data in MongoDB

### Step 5: Start Server

```bash
npm run dev
```

Visit `http://localhost:5005` and see the scraped data!

## 📊 What Gets Scraped

### LeetCode
- ✅ Total problems solved
- ✅ Easy/Medium/Hard breakdown  
- ✅ Contest rating
- ✅ Rating history
- ✅ Badges (Grandmaster, Master, Expert, etc.)

### CodeChef
- ✅ Problems solved
- ✅ Contest rating
- ✅ Star rating (1-7 stars)
- ✅ Badges

## ⚠️ Important Notes

1. **Rate Limiting**: The scraper includes delays to avoid being blocked. Scraping 54 students will take ~3-5 minutes.

2. **Invalid Usernames**: If a username doesn't exist or profile is private, that student will have empty stats.

3. **Re-scraping**: You can re-scrape anytime with `npm run db:scrape` to update data.

4. **Fallback**: If MongoDB isn't configured, the app will use in-memory storage (data lost on restart).

## 🆘 Need Help?

If you encounter issues:
1. Check MongoDB is running/accessible
2. Verify connection string is correct
3. Check usernames.json format is valid JSON
4. Check console for error messages

## 📚 Additional Documentation

See `MONGODB_SETUP.md` for more detailed information.





