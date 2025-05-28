const cron = require('node-cron');

const setupDailyMaintenance = () => {
  cron.schedule('0 20 * * *', async () => {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting daily maintenance...`);

    try {
      // 1. Clean Redis memory
      await cleanRedisMemory();

      // 2. Verify all event statuses
      await verifyEventStatuses();

      console.log('Daily maintenance completed successfully');
    } catch (error) {
      console.error('Daily maintenance failed:', error);
    }

    console.log(
      `[${new Date().toISOString()}] Maintenance completed in ${
        Date.now() - startTime
      }ms`
    );
  });
};

module.exports = setupDailyMaintenance;
