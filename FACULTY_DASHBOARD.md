# Faculty Dashboard Feature

## Overview
Faculty users can now view visualizations and analytics for students in their assigned department.

## Features

### For Faculty Users
- **Department Overview**: View total students, active students, problems solved, and contests participated
- **Top Coders**: See the top 10 performing students in their department ranked by total problems solved
- **Platform Usage**: Visualize which coding platforms are most popular among department students
- **Difficulty Distribution**: See the breakdown of easy, medium, and hard problems solved
- **Engagement Metrics**: Track active students, contest participants, and participation rates

### For Admin Users
- **Department Assignment**: Admins can assign departments to faculty users in the User Management table
- **Faculty Management**: View and manage all faculty users and their department assignments

## Access

### Faculty Dashboard
- **URL**: `/faculty`
- **Access**: Faculty role only
- **Navigation**: "My Department" button in the navigation bar

### Admin Dashboard
- **URL**: `/admin`
- **Access**: Admin role only
- **Features**: Assign departments to faculty users in the "Status/Department" column

## Department Assignment

1. Login as an admin user
2. Navigate to Admin Dashboard (`/admin`)
3. In the User Management table, find a faculty user
4. In the "Status/Department" column, enter the department name (e.g., "CSE", "AI&DS", "CSBS", "CTP")
5. The department is automatically saved when you click outside the input field

## API Endpoints

### Get Department Statistics
```
GET /api/faculty/department-stats
Authorization: Bearer <token>
Role: faculty, admin
```

Returns department statistics including:
- Total students
- Total problems solved
- Average problems per student
- Total contests
- Top performers (top 10)
- Platform usage statistics
- Difficulty distribution
- Active students count
- Contest participants count

### Update Faculty Department
```
PATCH /api/admin/users/:id/department
Authorization: Bearer <token>
Role: admin
Body: { "department": "CSE" }
```

## Database Schema Updates

### User Schema
Added `department` field (optional string) to the User schema for faculty users:
```typescript
{
  id: string;
  username: string;
  role: "admin" | "faculty" | "student";
  department?: string; // For faculty users
  // ... other fields
}
```

## Testing

### Test Faculty Login
- Username: `mahalakshmi`, `sachin`, or `lakshanaad`
- Password: `faculty123`
- Default Department: `CTP`

### Test Admin Login
- Username: `admin`
- Password: `admin123`

## Notes
- Faculty users can only view their assigned department
- Admin users can view any department by passing a query parameter
- If a faculty user has no department assigned, they will see a message to contact an administrator
- The top coders list shows up to 10 students ranked by total problems solved
- Medal icons (🥇🥈🥉) are displayed for the top 3 performers
