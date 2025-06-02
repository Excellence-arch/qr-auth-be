const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');
const { scheduleEventStatusUpdate } = require('../queues/eventStatus');

exports.addEvent = async (req, res) => {
  const {
    name,
    description,
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    capacity,
    isPublic,
  } = req.body;

  // Required fields validation
  if (!name || !startDate || !endDate || !location || !description) {
    return res.status(400).json({
      status: false,
      message:
        'Name, start date, end date, location, and description are required',
    });
  }

  try {
    const newEvent = await Event.create({
      name,
      description,
      startDate,
      endDate,
      startTime: startTime || null,
      endTime: endTime || null,
      location,
      capacity: capacity ? parseInt(capacity) : 0,
      isPublic: isPublic !== undefined ? isPublic : true,
      account: req.user.id, // Changed from req.user.account to req.user.id to match your auth setup
      status: 'upcoming',
    });
    // await scheduleEventStatusUpdate(newEvent);

    res.status(201).json({
      status: true,
      message: 'Event created successfully',
      data: {
        event: {
          id: newEvent._id,
          name: newEvent.name,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          startTime: newEvent.startTime,
          endTime: newEvent.endTime,
          location: newEvent.location,
          capacity: newEvent.capacity,
          isPublic: newEvent.isPublic,
          status: newEvent.status,
        },
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

exports.getAccountEvents = async (req, res) => {
  try {
    const { status, search } = req.query;
    const accountId = req.user.id;

    // Build the query
    const query = { account: accountId };

    // Add status filter if provided
    if (status) {
      query.status = { $in: Array.isArray(status) ? status : [status] };
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate('attendees', 'name email')
      .populate('codes', 'code used')
      .populate('tickets', 'name price')
      .sort({ startDate: 1 }); // Sort by start date ascending

    res.status(200).json({
      status: true,
      message: 'Events retrieved successfully',
      data: {
        events: events.map((event) => ({
          id: event._id,
          name: event.name,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          capacity: event.capacity,
          isPublic: event.isPublic,
          status: event.status,
          attendeesCount: event.attendees.length,
          tickets: event.tickets,
        })),
      },
    });
  } catch (error) {
    console.error('Error retrieving events:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};