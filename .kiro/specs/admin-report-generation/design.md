# Design Document: Admin Report Generation

## Overview

This feature adds a comprehensive reporting system to the admin dashboard that enables weekly performance tracking, bulk data scraping, and downloadable reports. The system uses a dedicated MongoDB database (via MONGODB_URI_ADMIN) to store weekly snapshots of student performance data, allowing administrators to track progress over time and generate comparison reports.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Scrape      │  │ Create      │  │ View Reports &          │  │
│  │ Platform    │  │ Snapshot    │  │ Download CSV            │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Routes                               │
│  POST /api/admin/scrape/:platform                                │
│  GET  /api/admin/scrape/progress                                 │
│  POST /api/admin/snapshots                                       │
│  GET  /api/admin/snapshots                                       │
│  GET  /api/admin/reports/:platform                               │
│  GET  /api/admin/reports                                         │
└─────────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Report Service                              │
│  - scrapeAllStudentsForPlatform()                                │
│  - createWeeklySnapshot()                                        │
│  - generatePlatformReport()                                      │
│  - generateFullReport()                                          │
└─────────────────────────────────────────────────────────────────┘
          │                                      │
          ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────────────┐
│   Main MongoDB      │              │   Admin MongoDB             │
│   (Student Data)    │              │   (Weekly Snapshots)        │
│   MONGODB_URI       │              │   MONGODB_URI_ADMIN         │
└─────────────────────┘              └─────────────────────────────┘
```

## Data Models

### WeeklySnapshot
Stored in the admin database to track weekly performance:

```typescript
interface WeeklySnapshot {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  createdAt: Date;
  platformStats: PlatformSnapshot[];
  studentSnapshots: StudentSnapshot[];
  totalStudents: number;
  totalProblemsAllPlatforms: number;
  totalContestsAllPlatforms: number;
}

interface PlatformSnapshot {
  platform: string;
  totalProblems: number;
  easy: number;
  medium: number;
  hard: number;
  totalContests: number;
  avgRating: number;
  activeUsers: number;
}

interface StudentSnapshot {
  studentId: string;
  username: string;
  name: string;
  dept: string;
  platforms: {
    platform: string;
    username: string;
    problemsSolved: number;
    contestsAttended: number;
    currentRating: number;
  }[];
  totalProblems: number;
  totalContests: number;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/scrape/:platform` | Start bulk scraping for a platform |
| GET | `/api/admin/scrape/progress` | Get current scraping progress |
| POST | `/api/admin/snapshots` | Create a new weekly snapshot |
| GET | `/api/admin/snapshots` | Get all snapshots |
| GET | `/api/admin/snapshots/latest` | Get the most recent snapshot |
| GET | `/api/admin/snapshots/:id` | Get a specific snapshot |
| DELETE | `/api/admin/snapshots/:id` | Delete a snapshot |
| GET | `/api/admin/reports` | Get full report (all platforms) |
| GET | `/api/admin/reports/:platform` | Get platform-specific report |

## Features

### 1. Bulk Platform Scraping
- Scrape all students' data for a specific platform
- Real-time progress tracking
- Rate limiting to avoid API blocks
- Error handling and reporting

### 2. Weekly Snapshots
- Capture current state of all student data
- Store in separate admin database
- Track week boundaries (Monday-Sunday)

### 3. Report Generation
- Compare current week vs previous week
- Platform-wise statistics
- Top gainers identification
- Department-wise breakdown
- CSV export functionality

### 4. UI Components
- Data Collection section with scrape buttons
- Progress indicator during scraping
- Platform selector for reports
- Comparison tables with change indicators
- Top gainers display
- Department statistics
- Snapshot history

## Files Created/Modified

### New Files
- `server/models/WeeklySnapshot.ts` - MongoDB model for snapshots
- `server/storage/adminMongodb.ts` - Admin database storage layer
- `server/services/reportService.ts` - Report generation logic
- `client/src/components/AdminReports.tsx` - Reports UI component

### Modified Files
- `server/routes.ts` - Added report API endpoints
- `client/src/pages/AdminDashboard.tsx` - Added Reports tab
- `.env.example` - Added MONGODB_URI_ADMIN variable

## Usage

1. Navigate to Admin Dashboard → Reports tab
2. Click "Scrape [Platform]" to update student data for that platform
3. Click "Create Weekly Snapshot" to save current data
4. Select a platform or "All Platforms" to view reports
5. Click "Download CSV" to export the report
