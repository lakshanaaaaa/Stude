# Implementation Plan: Topper of the Week

## Overview

Implement a comprehensive "Topper of the Week" feature that calculates and displays the most impactful student performer over a rolling 7-day period using weighted scoring, rating improvements, contest participation, and consistency bonuses.

## Tasks

- [x] 1. Create WeeklySnapshot database model
  - Create Mongoose schema for WeeklySnapshot with studentId, timestamp, problemStats, ratings, contests
  - Add compound index on (studentId, timestamp) for efficient queries
  - Add TTL index to auto-delete snapshots older than 30 days
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Implement snapshot creation service
  - [x] 2.1 Create `snapshotService.ts` with `createDailySnapshot()` function
    - Fetch all students from database
    - Extract current problemStats, ratings, and contest counts per platform
    - Store snapshot with current timestamp
    - _Requirements: 8.1, 8.2_
  
  - [ ] 2.2 Add scheduled job for daily snapshot creation
    - Use node-cron or similar to schedule daily execution at midnight UTC
    - Handle errors gracefully with logging
    - _Requirements: 8.1_
  
  - [x] 2.3 Create manual snapshot endpoint for admin
    - Add POST `/api/admin/snapshot/create` endpoint
    - Require admin authentication
    - Return snapshot creation status
    - _Requirements: 8.1_

- [x] 3. Implement weekly metrics calculation service
  - [x] 3.1 Create `topperService.ts` with core calculation functions
    - Implement `getBaselineSnapshot(studentId, daysAgo)` to fetch 7-day-old snapshot
    - Implement `calculateWeeklyProblems()` with platform weights
    - Implement `calculateRatingDelta()` with positive-only logic
    - Implement `calculateContestPoints()` with platform-specific points
    - Implement `calculateConsistencyBonus()` with streak detection
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3_
  
  - [x] 3.2 Implement `calculateWeeklyImpactScore()` function
    - Combine all metrics using the formula: (Weighted Problems × 10) + Rating Delta + Contest Points + Consistency Bonus
    - Return WeeklyMetrics object with all breakdown data
    - _Requirements: 6.1_
  
  - [x] 3.3 Implement `checkEligibility()` function
    - Verify weighted problems >= 5
    - Verify active days >= 3
    - Return boolean eligibility status
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 3.4 Implement `getActiveDaysCount()` function
    - Query student's problem-solving activity for last 7 days
    - Count unique days with at least one problem solved
    - Handle timezone considerations
    - _Requirements: 4.1, 4.4, 4.5_

- [x] 4. Implement topper selection logic
  - [x] 4.1 Create `getTopperOfTheWeek()` function
    - Calculate weekly metrics for all students
    - Filter by eligibility threshold
    - Sort by weekly impact score (descending)
    - Apply tie-breakers: rating delta → weighted problems → registration date
    - Return top student with full metrics
    - _Requirements: 5.3, 5.5, 6.1, 6.2, 6.3, 6.4_
  
  - [x] 4.2 Create `getWeeklyLeaderboard()` function
    - Calculate weekly metrics for all eligible students
    - Sort by weekly impact score with tie-breakers
    - Return top 10 students with ranks
    - _Requirements: 9.3, 9.4_
  
  - [x] 4.3 Implement caching for topper calculations
    - Use in-memory cache with 1-hour TTL
    - Cache both topper and weekly leaderboard
    - Invalidate cache on manual refresh
    - _Requirements: 9.5_

- [x] 5. Create API endpoints
  - [x] 5.1 Add GET `/api/topper-of-the-week` endpoint
    - Return current Topper of the Week with full metrics
    - Include: student details, weekly impact score, problems breakdown, rating delta, contests, consistency
    - Handle case when no eligible students exist
    - _Requirements: 9.1, 9.2_
  
  - [x] 5.2 Add GET `/api/weekly-leaderboard` endpoint
    - Return top 10 students by weekly impact score
    - Include rank, student details, and weekly metrics for each
    - _Requirements: 9.3, 9.4_
  
  - [x] 5.3 Add POST `/api/admin/topper/refresh` endpoint
    - Manually trigger topper recalculation
    - Clear cache and recalculate immediately
    - Require admin authentication
    - _Requirements: 6.5_

- [x] 6. Create frontend TopperOfTheWeekCard component
  - [x] 6.1 Create `TopperOfTheWeekCard.tsx` component
    - Display student name, department, and avatar
    - Show weekly impact score prominently
    - Display metrics breakdown: problems solved, rating improvement, contests, active days
    - Show platform-specific problem counts with weights
    - Add visual indicators for streak bonus
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 6.2 Handle empty state when no eligible students
    - Display encouraging message to participate
    - Show minimum threshold requirements
    - _Requirements: 7.4_
  
  - [x] 6.3 Add loading and error states
    - Show skeleton loader while fetching data
    - Handle API errors gracefully
    - _Requirements: 7.5_

- [x] 7. Update Dashboard to use TopperOfTheWeekCard
  - [x] 7.1 Replace TopCoderCard with TopperOfTheWeekCard
    - Update Dashboard.tsx to fetch topper-of-the-week data
    - Remove old getTopCoder logic
    - _Requirements: 7.1, 7.5_
  
  - [x] 7.2 Add weekly leaderboard tab
    - Add new tab "Weekly Leaders" to leaderboard section
    - Display top 10 students by weekly impact score
    - Show weekly metrics for each student
    - _Requirements: 9.3, 9.4_

- [ ] 8. Implement admin configuration interface
  - [ ] 8.1 Create configuration model
    - Store platform weights, contest points, consistency bonuses, thresholds
    - Add default values
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 8.2 Create admin configuration API endpoints
    - GET `/api/admin/topper/config` - Fetch current configuration
    - PUT `/api/admin/topper/config` - Update configuration
    - Validate configuration values
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 8.3 Create admin configuration UI
    - Add configuration page in admin dashboard
    - Form inputs for all configurable values
    - Save and reset functionality
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9. Initialize snapshot data for existing students
  - [x] 9.1 Create migration script
    - Create initial snapshot for all existing students
    - Use current data as baseline
    - Run once during deployment
    - _Requirements: 8.1, 8.2_

- [ ] 10. Testing and validation
  - [ ]* 10.1 Write unit tests for calculation functions
    - Test weekly impact score formula
    - Test platform weight application
    - Test rating delta handling
    - Test consistency bonus calculation
    - Test eligibility checks
    - _Requirements: 1.3, 2.2, 2.3, 4.2, 4.3, 5.1, 5.2, 6.1_
  
  - [ ]* 10.2 Write integration tests
    - Test snapshot creation and retrieval
    - Test topper selection with multiple students
    - Test API endpoints
    - Test tie-breaking scenarios
    - _Requirements: 6.2, 6.3, 6.4, 8.4, 8.5_
  
  - [ ]* 10.3 Write property tests for scoring algorithm
    - **Property 1: Weekly Impact Score Calculation**
    - **Validates: Requirements 6.1**
    - **Property 2: Platform Weight Application**
    - **Validates: Requirements 1.3**
    - **Property 3: Rating Delta Positivity**
    - **Validates: Requirements 2.3**
    - **Property 4: Contest Points Assignment**
    - **Validates: Requirements 3.2**
    - **Property 5: Consistency Bonus Calculation**
    - **Validates: Requirements 4.2, 4.3**
    - **Property 6: Eligibility Threshold**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 11. Documentation and deployment
  - [ ] 11.1 Update README with Topper of the Week feature
    - Document scoring algorithm
    - Explain eligibility criteria
    - Document configuration options
    - _Requirements: All_
  
  - [ ] 11.2 Create admin guide
    - How to configure topper settings
    - How to manually refresh calculations
    - How to create snapshots
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Snapshots are created daily automatically via cron job
- Cache is used to optimize performance (1-hour TTL)
- Admin configuration allows tuning without code changes
