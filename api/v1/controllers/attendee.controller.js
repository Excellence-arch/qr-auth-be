const { default: mongoose } = require('mongoose');
const Attendee = require('../models/Attendee.model');
const Code = require('../models/Code.model');
const Event = require('../models/Event.model');
const Ticket = require('../models/Ticket.model');
const { generateQRCode } = require('../utils/qr');

exports.addAttendee = async (req, res) => {
  const { name, email, phone, eventId, ticketType = 'standard' } = req.body;

  // Validate required fields
  if (!name || !email || !eventId) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and event ID are required fields',
    });
  }

  try {
    // Start parallel operations
    const [event, existingAttendee] = await Promise.all([
      Event.findById(eventId),
      Attendee.findOne({ email, event: eventId }),
    ]);

    // Validate the event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check for existing attendee
    if (existingAttendee) {
      return res.status(400).json({
        success: false,
        message: 'Attendee with this email already exists for the event',
      });
    }

    // Process ticket in parallel with other operations
    // Suggested improvement for ticket handling in addAttendee
    const ticketPromise = (async () => {
      if (!ticketType) return null;

      const normalizedTicketType = ticketType.toUpperCase();
      let ticket = await Ticket.findOne({ name: normalizedTicketType });

      if (!ticket) {
        ticket = await Ticket.create({
          name: normalizedTicketType,
          price: 0, // Default price
        });
        if (!event.tickets.includes(ticket._id)) {
          event.tickets.push(ticket._id);
        }
      }
      return ticket;
    })();

    // Create code and attendee in parallel
    const [ticket, code] = await Promise.all([
      ticketPromise,
      Code.create({ event: eventId }),
    ]);

    // Set ticket reference if it exists
    if (ticket) {
      code.ticket = ticket._id;
      await code.save();
    }

    
    // Generate QR code data
    const qrData = await generateQRCode(code._id);

    // Create attendee
    const newAttendee = await Attendee.create({
      name,
      email,
      phone,
      event: eventId,
      code: code._id,
    });

    // Update event references
    event.attendees.push(newAttendee._id);
    event.codes.push(code._id);
    code.attendee = newAttendee._id;
    await code.save();

    // Save all event changes at once
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Attendee added successfully',
      data: {
        attendee: {
          id: newAttendee._id,
          name: newAttendee.name,
          email: newAttendee.email,
          phone: newAttendee.phone,
          eventId: newAttendee.event,
          eventName: event.name,
          code: code.code,
          qrCode: qrData.qrImage,
          qrPublicUrl: qrData.publicUrl,
          qrAdminUrl: qrData.adminUrl,
          ticketType: ticket?.name || 'standard',
        },
      },
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add attendee',
      error: error.message,
    });
  }
};



exports.getAttendee = async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid attendee ID format',
    });
  }

  try {
    const attendee = await Attendee.findById(id)
      .populate({
        path: 'event',
        select: 'name startDate endDate location',
      })
      .populate({
        path: 'code',
        select: 'code used',
      });

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found',
      });
    }

    // Validate populated data exists
    if (!attendee.event || !attendee.code) {
      return res.status(404).json({
        success: false,
        message: 'Associated event or code not found',
      });
    }

    // Generate QR code with error handling
    let qrCode;
    try {
      qrCode = await generateQRCode(attendee.code);
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
      qrCode = null;
    }

    // Construct response data
    const responseData = {
      id: attendee._id,
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone || null,
      event: {
        id: attendee.event._id,
        name: attendee.event.name,
        startDate: attendee.event.startDate,
        endDate: attendee.event.endDate,
        location: attendee.event.location,
      },
      code: {
        id: attendee.code._id,
        value: attendee.code.code,
        used: attendee.code.used,
      },
      qrCode: qrCode.qrImage,
      createdAt: attendee.createdAt,
      updatedAt: attendee.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Attendee retrieved successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching attendee:', error);

    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to fetch attendee';

    if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = 'Invalid attendee ID format';
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


exports.getAttendeesByEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const attendees = await Attendee.find({ event: eventId })
      .populate('event', 'name startDate endDate location')
      .populate('code', 'code used');

    if (!attendees.length) {
      return res.status(404).json({
        success: false,
        message: 'No attendees found for this event',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attendees: attendees.map(attendee => ({
          id: attendee._id,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          eventId: attendee.event._id,
          eventName: attendee.event.name,
          eventStartDate: attendee.event.startDate,
          eventEndDate: attendee.event.endDate,
          eventLocation: attendee.event.location,
          code: attendee.code.code,
          codeUsed: attendee.code.used,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendees',
      error: error.message,
    });
  }
};


// Get all attendees for a user (across all their events)
exports.getUserAttendees = async (req, res) => {
  const accountId = req.user.id
  try {
    const events = await Event.find({ account: accountId });
    
    if (!events.length) {
      return res.status(404).json({
        success: false,
        message: 'No events found for this user',
      });
    }

    const eventIds = events.map(event => event._id);

    // Then get all attendees for these events
    const attendees = await Attendee.find({ event: { $in: eventIds } })
      .populate({
        path: 'event',
        select: 'name startDate endDate location'
      })
      .populate({
        path: 'code',
        select: 'code used'
      })
      .sort({ createdAt: -1 });

    if (!attendees.length) {
      return res.status(404).json({
        success: false,
        message: 'No attendees found for your events',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        attendees: attendees.map(attendee => ({
          _id: attendee._id,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          status: attendee.code.used ? 'checked-in' : 'registered',
          event: {
            id: attendee.event._id,
            name: attendee.event.name,
            startDate: attendee.event.startDate,
            endDate: attendee.event.endDate,
            location: attendee.event.location,
          },
          code: attendee.code.code,
          createdAt: attendee.createdAt,
          updatedAt: attendee.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendees',
      error: error.message,
    });
  }
};

// Check in an attendee
exports.checkInAttendee = async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid attendee ID format',
    });
  }

  try {
    // Find the attendee and populate the code
    const attendee = await Attendee.findById(id).populate('code');

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found',
      });
    }

    // Check if already checked in
    if (attendee.code.used) {
      return res.status(400).json({
        success: false,
        message: 'Attendee already checked in',
      });
    }

    // Update the code status
    attendee.code.used = true;
    attendee.code.usedAt = new Date();
    await attendee.code.save();

    res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      data: {
        id: attendee._id,
        name: attendee.name,
        email: attendee.email,
        code: attendee.code.code,
        checkedInAt: attendee.code.usedAt,
      },
    });
  } catch (error) {
    console.error('Error checking in attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in attendee',
      error: error.message,
    });
  }
};

// Update an attendee
exports.updateAttendee = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid attendee ID format',
    });
  }

  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required fields',
    });
  }

  try {
    // Find the attendee
    const attendee = await Attendee.findById(id);

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found',
      });
    }

    // Check if email is being changed to one that already exists for this event
    if (email !== attendee.email) {
      const existingAttendee = await Attendee.findOne({ 
        email, 
        event: attendee.event 
      });

      if (existingAttendee) {
        return res.status(400).json({
          success: false,
          message: 'Another attendee with this email already exists for the event',
        });
      }
    }

    // Update the attendee
    attendee.name = name;
    attendee.email = email;
    attendee.phone = phone;
    await attendee.save();

    res.status(200).json({
      success: true,
      message: 'Attendee updated successfully',
      data: {
        id: attendee._id,
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        eventId: attendee.event,
      },
    });
  } catch (error) {
    console.error('Error updating attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendee',
      error: error.message,
    });
  }
};

// Delete an attendee
exports.deleteAttendee = async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid attendee ID format',
    });
  }

  try {
    // Find and delete the attendee
    const attendee = await Attendee.findByIdAndDelete(id);

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found',
      });
    }

    // Also delete the associated code
    await Code.findByIdAndDelete(attendee.code);

    // Remove attendee reference from event
    await Event.updateOne(
      { _id: attendee.event },
      { $pull: { attendees: attendee._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Attendee deleted successfully',
      data: {
        id: attendee._id,
        name: attendee.name,
        email: attendee.email,
      },
    });
  } catch (error) {
    console.error('Error deleting attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendee',
      error: error.message,
    });
  }
};