const Queue = require('../queues');
const Event = require('../models/Event.model');
const redisConfig = require('../config/redis');

const eventStatusQueue = new Queue('eventStatus', redisConfig);

// Process jobs
eventStatusQueue.process('updateStatus', async (job) => {
  const { eventId, targetStatus } = job.data;

  try {
    const event = await Event.findByIdAndUpdate(
      eventId,
      { status: targetStatus },
      { new: true }
    );

    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    console.log(`Updated event ${eventId} status to ${targetStatus}`);
    return { success: true };
  } catch (error) {
    console.error(`Error updating event status: ${error.message}`);
    throw error;
  }
});

// Clean up completed jobs to save memory
eventStatusQueue.on('completed', (job) => {
  job.remove();
});

// Add this to your queue setup
eventStatusQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

// Clean up failed jobs (optional)
eventStatusQueue.on('failed', (job, err) => {
  console.error(`Job failed for event ${job.data.eventId}:`, err);
  job.remove();
});

const scheduleEventStatusUpdate = async (event) => {
  const now = Date.now();
  const startTime = new Date(event.startDate).getTime();
  const endTime = new Date(event.endDate).getTime();

  // Schedule status change to 'active' if event is upcoming
  if (event.status === 'upcoming' && startTime > now) {
    const msUntilStart = startTime - now;
    await eventStatusQueue.add(
      'updateStatus',
      { eventId: event._id, targetStatus: 'active' },
      { delay: msUntilStart, removeOnComplete: true }
    );
  }

  // Schedule status change to 'completed' if event is upcoming or active
  if (
    (event.status === 'upcoming' || event.status === 'active') &&
    endTime > now
  ) {
    const msUntilEnd = endTime - now;
    await eventStatusQueue.add(
      'updateStatus',
      { eventId: event._id, targetStatus: 'completed' },
      { delay: msUntilEnd, removeOnComplete: true }
    );
  }
};


module.exports = { eventStatusQueue, scheduleEventStatusUpdate };