# Student Coding Performance Analytics Platform

A comprehensive full-stack web application designed to track, analyze, and visualize student coding performance across multiple competitive programming platforms. Built for educational institutions to monitor student progress, identify improvement opportunities, and foster a competitive coding culture.

## 🎯 Purpose

This platform serves as a centralized hub for tracking student coding achievements across LeetCode, CodeChef, and CodeForces. It provides:

- **Real-time Performance Tracking**: Automated data collection from multiple coding platforms
- **Actionable Insights**: Analytics dashboards for students, faculty, and administrators
- **Progress Monitoring**: Historical data tracking to identify trends and improvements
- **Competitive Environment**: Leaderboards and achievement badges to motivate students
- **Administrative Control**: Comprehensive user management and role-based access

## 📸 Screenshots

### Student Profile Dashboard
![Student Profile](screenshots/student-profile.png)
*Comprehensive student profile showing coding accounts, problem-solving analytics with difficulty distribution, platform-wise statistics, contest rating trends across multiple platforms, and achievement badges.*

### Faculty Analytics Dashboard
![Faculty Analytics](screenshots/faculty-analytics.png)
*Faculty dashboard displaying department-wide analytics including rating improvement tracking, contest participation metrics, and detailed student performance comparisons with expandable lists.*

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)
*Administrative interface for user management with role assignment, onboarding status tracking, user statistics, and bulk operations for managing students, faculty, and administrators.*

## Features

### 👤 User Management
- **Google OAuth Authentication**: Secure login with Google accounts
- **Role-Based Access Control**: Student, Faculty, and Admin roles with specific permissions
- **Profile Picture Upload**: Cloudinary-powered image uploads with automatic optimization
- **Onboarding Flow**: Guided setup for new users to connect coding platform accounts

### 📊 Student Analytics
- **Multi-Platform Integration**: Track performance across LeetCode, CodeChef, and CodeForces
- **Problem Solving Stats**: Total problems solved with difficulty breakdown (Easy, Medium, Hard)
- **Contest Analytics**: Rating progression charts and contest participation tracking
- **Achievement Badges**: Automated badge system for milestones and accomplishments
- **Platform-wise Statistics**: Detailed breakdown of problems solved per platform

### 🎓 Faculty Dashboard
- **Department Overview**: View all students in assigned department
- **Performance Analytics**: Track student improvement and contest participation
- **Rating Improvement Tracking**: Identify students who improved vs. those who need support
- **Contest Participation Metrics**: Monitor which students are actively participating
- **Bulk Data Refresh**: Update all student data with a single click

### 🛡️ Admin Panel
- **User Management**: Create, update, and delete user accounts
- **Role Assignment**: Change user roles and assign departments to faculty
- **Onboarding Management**: Reset onboarding status and track incomplete profiles
- **Role Requests**: Approve or reject faculty/admin role requests
- **System Analytics**: View overall platform statistics and top performers
- **Bulk Operations**: Refresh all student data across the platform

### 🔄 Automated Data Scraping
- **Real-time Updates**: Automated scraping of coding platform data
- **Multiple Platform Support**: LeetCode, CodeChef, and CodeForces integration
- **Error Handling**: Robust scraping with retry logic and error reporting
- **Progress Tracking**: Monitor scraping progress for bulk operations
- **Weekly Snapshots**: Automated weekly data snapshots for historical tracking

## 🏗️ Architecture

The platform follows a modern full-stack architecture with clear separation of concerns:

- **Client-Server Architecture**: React SPA frontend communicating with Express REST API
- **Role-Based Access Control**: Three-tier permission system (Student, Faculty, Admin)
- **Automated Data Pipeline**: Scheduled scraping jobs with error handling and retry logic
- **Real-time Updates**: WebSocket connections for live data refresh notifications
- **Cloud Storage**: Cloudinary integration for optimized image delivery
- **Session Management**: Secure JWT-based authentication with Google OAuth

## 💻 Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Lightning-fast build tool and hot module replacement
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - Accessible, customizable component library built on Radix UI
- **Recharts** - Composable charting library for data visualization
- **TanStack Query (React Query)** - Powerful data fetching, caching, and synchronization
- **Wouter** - Minimalist routing library (1.3KB)
- **Framer Motion** - Production-ready animation library
- **React Hook Form** - Performant form validation with Zod schema integration

### Backend
- **Node.js** - JavaScript runtime built on Chrome's V8 engine
- **Express** - Fast, unopinionated web framework
- **TypeScript** - Type-safe server-side development
- **Passport.js** - Flexible authentication middleware
- **Google OAuth 2.0** - Secure third-party authentication
- **Express Session** - Session management with MemoryStore
- **Bcrypt** - Password hashing for secure credential storage
- **JWT (JSON Web Tokens)** - Stateless authentication tokens

### Database & Storage
- **MongoDB** - NoSQL document database for flexible schema design
- **Mongoose** - Elegant MongoDB object modeling with schema validation
- **Cloudinary** - Cloud-based image storage, optimization, and CDN delivery
- **Multer** - Middleware for handling multipart/form-data file uploads

### Web Scraping & Automation
- **Cheerio** - Fast, flexible HTML parsing and manipulation
- **Axios** - Promise-based HTTP client for API requests
- **Custom Scrapers** - Platform-specific data extraction logic for LeetCode, CodeChef, and CodeForces
- **Retry Logic** - Robust error handling with exponential backoff
- **Rate Limiting** - Respectful scraping with request throttling

### Development Tools
- **Drizzle ORM** - TypeScript ORM with SQL-like syntax
- **Zod** - TypeScript-first schema validation
- **ESBuild** - Extremely fast JavaScript bundler
- **PostCSS** - CSS transformation with Autoprefixer
- **Cross-env** - Cross-platform environment variable management

## 🔧 Key Technical Features

### Automated Data Collection
- Scheduled scraping jobs that run periodically to fetch latest data
- Platform-specific scrapers with custom parsing logic
- Error handling with automatic retries and failure notifications
- Progress tracking for bulk operations
- Weekly snapshot system for historical data analysis

### Performance Optimization
- React Query caching reduces unnecessary API calls
- Lazy loading and code splitting for faster initial load
- Cloudinary automatic image optimization and responsive delivery
- MongoDB indexing for fast query performance
- Vite's optimized production builds with tree-shaking

### Security Features
- Google OAuth 2.0 for secure authentication
- JWT tokens with expiration and refresh logic
- Role-based middleware protecting sensitive routes
- Password hashing with bcrypt (10 rounds)
- CORS configuration for cross-origin security
- Environment variable management for sensitive credentials

### Data Visualization
- Interactive charts with Recharts (line, bar, pie, area)
- Real-time rating progression graphs
- Difficulty distribution pie charts
- Platform-wise problem-solving statistics
- Contest participation timelines
- Department-wide analytics dashboards

## 📊 Data Models

### User Model
- Authentication credentials (Google OAuth ID, email)
- Role assignment (Student, Faculty, Admin)
- Profile information (name, department, profile picture)
- Onboarding status tracking
- Session management

### Student Analytics Model
- Coding platform usernames (main and sub-accounts)
- Problem-solving statistics (total, per-platform, per-difficulty)
- Contest ratings and participation history
- Achievement badges and milestones
- Weekly performance snapshots
- Last updated timestamps

### Faculty Model
- Department assignments
- Access permissions
- Student monitoring capabilities

## 🎨 Design Philosophy

- **User-Centric**: Intuitive interfaces designed for students, faculty, and administrators
- **Responsive**: Mobile-first design that works seamlessly across all devices
- **Accessible**: WCAG-compliant components from Radix UI
- **Performant**: Optimized bundle sizes and lazy loading strategies
- **Maintainable**: TypeScript throughout for type safety and better developer experience
- **Scalable**: Modular architecture supporting future platform integrations

## 📈 Use Cases

### For Students
- Track personal coding progress across multiple platforms
- Visualize improvement trends over time
- Compare performance with peers
- Earn achievement badges for milestones
- Maintain a comprehensive coding portfolio

### For Faculty
- Monitor department-wide coding activity
- Identify students who need additional support
- Track contest participation rates
- Analyze rating improvements
- Generate performance reports

### For Administrators
- Manage user accounts and roles
- Oversee platform-wide statistics
- Handle role change requests
- Perform bulk data operations
- Monitor system health and scraping status

## 🌟 Future Enhancements

- Additional platform integrations (HackerRank, Codeforces Gym, AtCoder)
- Email notifications for achievements and milestones
- Peer comparison and ranking systems
- Export functionality for reports and analytics
- Mobile application for iOS and Android
- Machine learning predictions for contest performance
- Integration with college LMS systems

## 📄 License

MIT License - Feel free to use this project for educational purposes.