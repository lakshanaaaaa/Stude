# Requirements Document

## Introduction

This feature enables administrators to generate weekly performance reports for all students across coding platforms. The system stores weekly snapshots of student data in a dedicated admin MongoDB database, allows bulk scraping of student data per platform, and generates comparison reports showing progress between weeks. Reports can be downloaded in a platform-wise format.

## Glossary

- **Admin_Database**: A separate MongoDB database (using MONGODB_URI_ADMIN) dedicated to storing weekly snapshots and report data
- **Weekly_Snapshot**: A point-in-time capture of all student performance data for a specific week
- **Platform**: A coding practice website (LeetCode, CodeChef, CodeForces, GeeksforGeeks, HackerRank)
- **Bulk_Scrape**: The process of fetching data for all students from a specific platform in a single operation
- **Comparison_Report**: A document showing the difference in metrics between two weekly snapshots
- **Report_System**: The component responsible for generating, storing, and downloading reports

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to store weekly performance snapshots in a dedicated admin database, so that I can track student progress over time without affecting the main application database.

#### Acceptance Criteria

1. WHEN the Report_System initializes THEN the Report_System SHALL connect to the Admin_Database using the MONGODB_URI_ADMIN environment variable
2. WHEN a weekly snapshot is created THEN the Report_System SHALL store the snapshot with a timestamp, week identifier, and all student performance data
3. WHEN storing a snapshot THEN the Report_System SHALL include platform-specific metrics (problems solved, ratings, contests) for each student
4. IF the Admin_Database connection fails THEN the Report_System SHALL log the error and notify the administrator without crashing the main application

### Requirement 2

**User Story:** As an administrator, I want to trigger bulk scraping of all students for a specific platform, so that I can update performance data efficiently.

#### Acceptance Criteria

1. WHEN an administrator clicks a platform-specific scrape button THEN the Report_System SHALL initiate scraping for all students who have accounts on that platform
2. WHILE bulk scraping is in progress THEN the Report_System SHALL display a progress indicator showing the number of students processed
3. WHEN a student's data is successfully scraped THEN the Report_System SHALL update both the main database and prepare data for the weekly snapshot
4. IF scraping fails for a specific student THEN the Report_System SHALL log the error and continue with the remaining students
5. WHEN bulk scraping completes THEN the Report_System SHALL display a summary showing successful and failed scrape counts

### Requirement 3

**User Story:** As an administrator, I want to save the current scraped data as a weekly snapshot, so that I can compare it with future data.

#### Acceptance Criteria

1. WHEN an administrator clicks the "Save Weekly Snapshot" button THEN the Report_System SHALL capture current data for all students and store it in the Admin_Database
2. WHEN saving a snapshot THEN the Report_System SHALL assign a week identifier based on the current date (ISO week number and year)
3. IF a snapshot for the current week already exists THEN the Report_System SHALL prompt the administrator to confirm overwriting
4. WHEN a snapshot is saved THEN the Report_System SHALL display a confirmation message with the snapshot details

### Requirement 4

**User Story:** As an administrator, I want to generate comparison reports between the current week and the previous week, so that I can analyze student progress.

#### Acceptance Criteria

1. WHEN an administrator requests a comparison report THEN the Report_System SHALL retrieve the current week and previous week snapshots from the Admin_Database
2. WHEN generating a comparison THEN the Report_System SHALL calculate the difference in problems solved (total, easy, medium, hard) for each student
3. WHEN generating a comparison THEN the Report_System SHALL calculate the difference in contest participation and rating changes per platform
4. WHEN displaying the comparison THEN the Report_System SHALL highlight students with positive progress in green and negative progress in red
5. IF no previous week snapshot exists THEN the Report_System SHALL display only the current week data with a message indicating no comparison is available

### Requirement 5

**User Story:** As an administrator, I want to download platform-wise reports, so that I can share and archive performance data externally.

#### Acceptance Criteria

1. WHEN an administrator selects a platform and clicks download THEN the Report_System SHALL generate a CSV file containing all student data for that platform
2. WHEN generating a platform report THEN the Report_System SHALL include student name, username, department, problems solved, rating, and week-over-week changes
3. WHEN downloading a report THEN the Report_System SHALL name the file with the platform name, week identifier, and generation timestamp
4. WHEN an administrator requests an "All Platforms" report THEN the Report_System SHALL generate a comprehensive CSV with data from all platforms combined

### Requirement 6

**User Story:** As an administrator, I want to view the report generation interface in the admin dashboard, so that I can easily access all reporting features.

#### Acceptance Criteria

1. WHEN an administrator navigates to the admin dashboard THEN the Report_System SHALL display a "Reports" tab alongside existing tabs
2. WHEN viewing the Reports tab THEN the Report_System SHALL display platform-specific scrape buttons for each supported platform
3. WHEN viewing the Reports tab THEN the Report_System SHALL display the current week's snapshot status and last update time
4. WHEN viewing the Reports tab THEN the Report_System SHALL display a comparison summary table with key metrics
5. WHEN viewing the Reports tab THEN the Report_System SHALL provide download buttons for each platform and an "All Platforms" option

