# Student Coding Performance Analytics Platform

A full-stack web application that tracks and analyzes student coding performance across multiple competitive programming platforms (LeetCode, CodeChef, CodeForces).

## Features

- **Profile Management**: Student authentication and profile management
- **Multi-Platform Scraping**: Automated data collection from coding platforms
- **Analytics Dashboard**: Comprehensive performance visualization
- **Contest Tracking**: Rating progression and contest participation analysis
- **Achievement System**: Badges and milestones tracking

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with Google OAuth
- **Charts**: Recharts for data visualization

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and OAuth credentials
   ```

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:scrape` - Scrape all student data
- `npm run make-admin` - Create admin user

## Documentation

- [Quick Start Guide](QUICK_START.md) - Get up and running in 5 minutes
- [Scraper Documentation](SCRAPER_README.md) - Detailed scraping system docs
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## License

MIT