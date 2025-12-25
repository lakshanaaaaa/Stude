# Competitive Programming Profile Scraper

## Overview
This system scrapes performance data from LeetCode, CodeChef, and Codeforces, stores it in the database, and displays it on student profile pages.

## Features

### 1. **Multi-Platform Support**
- **LeetCode**: Problems solved (Easy/Medium/Hard), contest rating, badges
- **CodeChef**: Problems solved, star rating, contest participation
- **Codeforces**: Problems solved, rating, rank badges

### 2. **Data Storage**
All scraped data is stored in MongoDB with the following structure:
```typescript
{
  problemStats: {
    total: number,
    easy: number,
    medium: number,
    hard: number,
    platformStats: { LeetCode: 0, CodeChef: 0, CodeForces: 0, ... },
    solvedOverTime: [{ date: string, count: number }]
  },
  contestStats: {
    currentRating: number,
    highestRating: number,
    totalContests: number,
    ratingHistory: [{ date: string, rating: number, platform: string }]
  },
  badges: [{ id: string, name: string, platform: string, icon: string, level: number }],
  lastScrapedAt: Date
}
```

### 3. **Profile Display**
- Visual cards showing problem-solving statistics
- Contest rating history with charts
- Platform-specific badges
- "Update Data" button to refresh statistics

## Implementation

### Backend Components

#### 1. Scrapers (`server/scrapers/`)
- **leetcode.ts**: Uses LeetCode GraphQL API
- **codechef.ts**: Web scraping with Cheerio
- **codeforces.ts**: Uses Codeforces REST API
- **index.ts**: Orchestrates scraping and merges results

#### 2. API Endpoints (`server/routes.ts`)
```typescript
POST /api/student/:username/scrape
```
- Triggers data scraping for a student
- Requires authentication
- Updates database with fresh data

#### 3. Storage Layer
- **MongoDB**: `updateStudentAnalytics()` method
- **In-Memory**: Fallback implementation

### Frontend Components

#### Profile Page (`client/src/pages/StudentProfile.tsx`)
- Displays student information
- Shows performance analytics
- "Update Data" button with loading state
- Toast notifications for success/error

## Usage

### 1. Store Platform IDs
Students add their platform usernames during onboarding or in profile settings:
```typescript
mainAccounts: [
  { platform: "LeetCode", username: "john_doe" },
  { platform: "CodeChef", username: "john_chef" },
  { platform: "CodeForces", username: "johncf" }
]
```

### 2. Trigger Scraping
**Manual (UI):**
- Click "Update Data" button on profile page

**Programmatic:**
```bash
npm run db:scrape
```

### 3. View Results
- Navigate to student profile
- Performance data displays automatically if available
- Charts show rating history and problem-solving trends

## API Details

### Scraping Endpoint
```http
POST /api/student/:username/scrape
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "student": { /* updated student object */ },
  "message": "Profile data scraped and updated successfully"
}
```

## Data Flow

1. **User clicks "Update Data"**
2. **Frontend sends POST request** to `/api/student/:username/scrape`
3. **Backend extracts platform usernames** from student.mainAccounts
4. **Scrapers fetch data** from each platform (with 2s delays)
5. **Results are merged** into unified format
6. **Database is updated** with new analytics
7. **Frontend refreshes** and displays updated data

## Error Handling

- Individual scraper failures don't break the entire process
- Failed platforms return empty stats
- User sees toast notification on errors
- Logs capture detailed error information

## Rate Limiting

- 2-second delay between platform requests
- Prevents API rate limiting
- Configurable in `server/scrapers/index.ts`

## Future Enhancements

1. **Scheduled Scraping**: Cron job to update all students daily
2. **More Platforms**: GeeksforGeeks, HackerRank, CodeStudio
3. **Caching**: Redis cache to reduce API calls
4. **Webhooks**: Real-time updates from platforms
5. **Analytics Dashboard**: Department-wide statistics

## Troubleshooting

### Scraping Fails
- Check platform username is correct
- Verify platform APIs are accessible
- Check rate limiting hasn't been triggered
- Review server logs for detailed errors

### Data Not Displaying
- Ensure scraping completed successfully
- Check `lastScrapedAt` timestamp in database
- Verify frontend is fetching latest data
- Clear browser cache and refresh

## Dependencies

```json
{
  "axios": "^1.13.2",
  "cheerio": "^1.1.2",
  "mongoose": "^9.0.2"
}
```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/student-analytics
```

## Scripts

```bash
# Scrape all students
npm run db:scrape

# Seed database
npm run db:seed

# Development server
npm run dev
```
