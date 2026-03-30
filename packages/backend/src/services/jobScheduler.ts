/**
 * Job Scheduler - Runs scraper every 6 hours
 * Uses node-cron for scheduling
 */

import cron from 'node-cron';
import { refreshAllJobs } from './jobScraper';

let isRunning = false;

/**
 * Initialize the job scheduler
 */
export function initializeJobScheduler() {
  console.log('⏱️ Initializing job scheduler...');

  // Run immediately on startup
  console.log('🚀 Running initial job refresh...');
  refreshAllJobs();

  // Run every 6 hours (0 */6 * * *)
  const jobSchedule = cron.schedule('0 */6 * * *', async () => {
    if (isRunning) {
      console.log('⚠️ Job refresh already running, skipping...');
      return;
    }

    isRunning = true;
    try {
      console.log('🔄 Scheduled job refresh started...');
      const result = await refreshAllJobs();
      console.log('✅ Scheduled job refresh completed');
    } catch (error) {
      console.error('❌ Scheduled job refresh failed:', error);
    } finally {
      isRunning = false;
    }
  });

  // Alternative: Run every hour for faster testing (during development)
  // cron.schedule('0 * * * *', async () => { ... })

  console.log('✅ Job scheduler initialized - will refresh every 6 hours');
  return jobSchedule;
}

/**
 * Manual trigger for job refresh (for testing)
 */
export async function triggerManualJobRefresh() {
  if (isRunning) {
    return { error: 'Job refresh already running' };
  }

  isRunning = true;
  try {
    const result = await refreshAllJobs();
    return result;
  } finally {
    isRunning = false;
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning,
    schedule: 'Every 6 hours at 00:00, 06:00, 12:00, 18:00',
    nextRun: new Date(),
  };
}
