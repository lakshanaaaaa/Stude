#!/usr/bin/env node
/**
 * Bulk Re-scrape Script
 * 
 * This script re-scrapes all students to fix corrupted data in MongoDB.
 * It scrapes each platform sequentially to avoid rate limiting.
 * 
 * Usage:
 *   node scripts/bulk-rescrape.js <admin-token>
 * 
 * Example:
 *   node scripts/bulk-rescrape.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:5005';
const ADMIN_TOKEN = process.argv[2];

if (!ADMIN_TOKEN) {
  console.error('❌ Error: Admin token required');
  console.error('Usage: node scripts/bulk-rescrape.js <admin-token>');
  process.exit(1);
}

const platforms = ['LeetCode', 'CodeChef', 'CodeForces'];

async function bulkScrape() {
  console.log('🚀 Starting bulk re-scrape for all students...\n');

  for (const platform of platforms) {
    console.log(`📊 Scraping ${platform}...`);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/scrape/${platform}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Failed to scrape ${platform}:`, error.error);
        continue;
      }

      const result = await response.json();
      console.log(`✅ ${platform}: ${result.message}`);
      
      // Wait 5 seconds between platforms to avoid rate limiting
      if (platform !== platforms[platforms.length - 1]) {
        console.log('⏳ Waiting 5 seconds before next platform...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`❌ Error scraping ${platform}:`, error.message);
    }
  }

  console.log('\n✅ Bulk re-scrape initiated for all platforms!');
  console.log('📊 Check progress at: GET /api/admin/scrape/progress');
  console.log('⏳ This may take several minutes depending on the number of students.');
}

bulkScrape().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
