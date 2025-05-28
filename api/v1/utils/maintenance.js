
const cleanRedisMemory = async () => {
  try {
    // Clean completed/failed jobs older than 1 hour
    const jobs = await eventStatusQueue.getJobs(['completed', 'failed']);
    const cutoff = Date.now() - 3600000; // 1 hour ago

    for (const job of jobs) {
      if (job.processedOn < cutoff) {
        await job.remove();
      }
    }

    // Additional Redis cleanup if needed
    await eventStatusQueue.clean(3600000, 'completed');
    await eventStatusQueue.clean(3600000, 'failed');

    console.log(`Redis memory cleaned, removed old jobs`);
  } catch (error) {
    console.error('Error cleaning Redis memory:', error);
    throw error;
  }
};

const verifyEventStatuses = async () => {
  try {
    const now = new Date();
    const events = await Event.find({
      $or: [{ status: 'upcoming' }, { status: 'active' }],
    });

    let corrected = 0;

    for (const event of events) {
      const shouldBeStatus = calculateCorrectStatus(event, now);

      if (event.status !== shouldBeStatus) {
        await Event.findByIdAndUpdate(event._id, { status: shouldBeStatus });
        corrected++;
      }

      // Reschedule if needed
      await scheduleEventStatusUpdate({
        ...event.toObject(),
        status: shouldBeStatus,
      });
    }

    console.log(`Verified ${events.length} events, corrected ${corrected}`);
  } catch (error) {
    console.error('Error verifying event statuses:', error);
    throw error;
  }
};

const calculateCorrectStatus = (event, now) => {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now > end) return 'completed';
  if (now > start) return 'active';
  return 'upcoming';
};

// Initialize the cron job when this module loads
setupDailyMaintenance();
