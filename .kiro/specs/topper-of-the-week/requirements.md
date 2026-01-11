# Requirements Document

## Introduction

The Topper of the Week feature identifies and highlights the most impactful student performer over a rolling 7-day period. Unlike lifetime leaderboards that favor long-term accumulation, this feature focuses on recent effort, consistency, and improvement to motivate active participation and reward genuine weekly progress.

## Glossary

- **System**: The Student Performance Analytics platform
- **Topper_of_the_Week**: The student with the highest weekly impact score over the last 7 days
- **Weekly_Impact_Score**: A calculated metric combining problems solved, rating improvement, contest participation, and consistency
- **Rolling_7_Day_Period**: The last 7 complete days from the current date
- **Platform_Weight**: A multiplier applied to problems based on platform difficulty (CodeForces > LeetCode > CodeChef)
- **Activity_Threshold**: Minimum requirements a student must meet to be eligible for Topper of the Week
- **Consistency_Bonus**: Additional points awarded for solving problems across multiple days
- **Rating_Delta**: The change in a student's rating over the 7-day period
- **Weekly_Snapshot**: A stored record of student statistics at a specific point in time

## Requirements

### Requirement 1: Track Weekly Problem Solving Activity

**User Story:** As a student, I want my weekly problem-solving activity to be tracked accurately, so that my recent efforts are recognized regardless of my lifetime statistics.

#### Acceptance Criteria

1. WHEN the system calculates weekly activity, THE System SHALL count only problems solved within the last 7 complete days
2. WHEN a student solves a problem, THE System SHALL record the timestamp, platform, and problem difficulty
3. WHEN calculating weekly problems, THE System SHALL apply platform-specific weights (CodeForces: 1.5x, LeetCode: 1.2x, CodeChef: 1.0x)
4. WHEN a student has no activity in the last 7 days, THE System SHALL exclude them from Topper of the Week consideration
5. THE System SHALL store daily snapshots of student statistics to enable accurate weekly delta calculations

### Requirement 2: Calculate Rating Improvement

**User Story:** As a student, I want my rating improvements to be recognized, so that genuine progress is rewarded in the weekly evaluation.

#### Acceptance Criteria

1. WHEN calculating rating improvement, THE System SHALL compare current rating with rating from 7 days ago for each platform
2. WHEN a student's rating increases, THE System SHALL add the positive delta to their weekly impact score
3. WHEN a student's rating decreases, THE System SHALL ignore the negative delta (no penalty)
4. WHEN a student has no rating history, THE System SHALL treat rating improvement as zero
5. THE System SHALL calculate rating improvement separately for each platform (LeetCode, CodeChef, CodeForces)

### Requirement 3: Reward Contest Participation

**User Story:** As a student, I want my contest participation to be valued, so that competitive efforts are recognized beyond just problem solving.

#### Acceptance Criteria

1. WHEN a student participates in a contest within the 7-day period, THE System SHALL award contest participation points
2. WHEN counting contests, THE System SHALL award 10 points per LeetCode contest, 15 points per CodeChef contest, and 20 points per CodeForces contest
3. WHEN a student participates in multiple contests, THE System SHALL sum all contest participation points
4. THE System SHALL identify contests by checking rating history entries within the 7-day period
5. WHEN a contest results in a rating change, THE System SHALL count both the contest participation points and the rating improvement separately

### Requirement 4: Encourage Daily Consistency

**User Story:** As a student, I want to be rewarded for solving problems consistently across multiple days, so that regular practice is valued over cramming.

#### Acceptance Criteria

1. WHEN calculating consistency, THE System SHALL count the number of unique days with at least one problem solved in the 7-day period
2. WHEN a student solves problems on N days, THE System SHALL award (N * 5) consistency bonus points
3. WHEN a student solves problems on all 7 days, THE System SHALL award an additional 20-point streak bonus
4. THE System SHALL consider a day as "active" if at least one problem was solved on any platform
5. WHEN determining active days, THE System SHALL use the student's local timezone or UTC if timezone is unavailable

### Requirement 5: Enforce Minimum Activity Threshold

**User Story:** As a system administrator, I want to ensure only genuinely active students are eligible for Topper of the Week, so that the award remains meaningful and motivating.

#### Acceptance Criteria

1. WHEN evaluating eligibility, THE System SHALL require a minimum of 5 weighted problems solved in the 7-day period
2. WHEN evaluating eligibility, THE System SHALL require activity on at least 3 different days in the 7-day period
3. WHEN a student does not meet the minimum threshold, THE System SHALL exclude them from Topper of the Week calculation
4. THE System SHALL make threshold values configurable by administrators
5. WHEN displaying Topper of the Week, THE System SHALL show only students who meet all eligibility criteria

### Requirement 6: Calculate Weekly Impact Score

**User Story:** As a student, I want a fair and transparent scoring system, so that I understand how the Topper of the Week is determined.

#### Acceptance Criteria

1. THE System SHALL calculate Weekly Impact Score using the formula: (Weighted Problems Solved × 10) + (Rating Improvement) + (Contest Participation Points) + (Consistency Bonus)
2. WHEN multiple students have the same Weekly Impact Score, THE System SHALL use total rating improvement as the first tie-breaker
3. WHEN tie-breaker scores are equal, THE System SHALL use total weighted problems solved as the second tie-breaker
4. WHEN all tie-breakers are equal, THE System SHALL use the student with the earliest registration date
5. THE System SHALL recalculate Weekly Impact Scores at least once per day

### Requirement 7: Display Topper of the Week

**User Story:** As a user, I want to see the current Topper of the Week prominently displayed, so that outstanding weekly performance is recognized and celebrated.

#### Acceptance Criteria

1. WHEN displaying the dashboard, THE System SHALL show the Topper of the Week in a prominent card at the top
2. WHEN displaying Topper of the Week, THE System SHALL show the student's name, department, weekly impact score, and key metrics breakdown
3. WHEN displaying metrics, THE System SHALL show: problems solved this week, rating improvement, contests participated, and active days
4. WHEN no student meets the eligibility criteria, THE System SHALL display a message encouraging participation
5. THE System SHALL update the Topper of the Week display automatically when the calculation runs

### Requirement 8: Store Weekly Snapshots

**User Story:** As a system administrator, I want historical snapshots of student data, so that weekly deltas can be calculated accurately even if current data changes.

#### Acceptance Criteria

1. THE System SHALL create a snapshot of all student statistics at least once per day
2. WHEN creating a snapshot, THE System SHALL store: total problems solved per platform, current ratings per platform, contest count, and timestamp
3. THE System SHALL retain snapshots for at least 30 days
4. WHEN calculating weekly metrics, THE System SHALL use the snapshot from exactly 7 days ago as the baseline
5. WHEN a 7-day-old snapshot is not available, THE System SHALL use the oldest available snapshot within 8 days

### Requirement 9: Provide Weekly Performance API

**User Story:** As a frontend developer, I want a dedicated API endpoint for weekly performance data, so that I can display Topper of the Week efficiently.

#### Acceptance Criteria

1. THE System SHALL provide a GET endpoint `/api/topper-of-the-week` that returns the current Topper of the Week
2. WHEN the endpoint is called, THE System SHALL return: student details, weekly impact score, and metrics breakdown
3. THE System SHALL provide a GET endpoint `/api/weekly-leaderboard` that returns top 10 students by weekly impact score
4. WHEN returning weekly leaderboard, THE System SHALL include rank, student details, and weekly metrics for each entry
5. THE System SHALL cache weekly calculations for at least 1 hour to optimize performance

### Requirement 10: Admin Configuration

**User Story:** As an administrator, I want to configure the Topper of the Week parameters, so that the system can be tuned for our institution's needs.

#### Acceptance Criteria

1. THE System SHALL allow administrators to configure platform weights through an admin interface
2. THE System SHALL allow administrators to configure minimum activity thresholds
3. THE System SHALL allow administrators to configure contest participation point values
4. THE System SHALL allow administrators to configure consistency bonus values
5. WHEN configuration changes are saved, THE System SHALL apply them to the next calculation cycle
