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
    const ticketPromise = (async () => {
      const normalizedTicketType = ticketType.toUpperCase();
      let ticket = await Ticket.findOne({ name: normalizedTicketType });
      if (!ticket && ticketType) {
        ticket = await Ticket.create({ name: normalizedTicketType });
        // Add new ticket to event if it doesn't exist
        if (!event.tickets.includes(ticket._id)) {
          event.tickets.push(ticket._id);
        }
      }
      return ticket;
    })();

    // Create code and attendee in parallel
    const [ticket, code] = await Promise.all([
      ticketPromise,
      Code.create({ used: false }),
    ]);

    // Set ticket reference if it exists
    if (ticket) {
      code.ticket = ticket._id;
      await code.save();
    }

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
          code: code._id,
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

  try {
    const attendee = await Attendee.findById(id)
      .populate('event', 'name startDate endDate location')
      .populate('code', 'code used');

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found',
      });
    }

    const qr = await generateQRCode(attendee._id);

    res.status(200).json({
      success: true,
      data: {
        attendee: {
          id: attendee._id,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          eventId: attendee.event._id,
          eventName: attendee.event.name,
          eventStartDate: attendee.event.startDate,
          eventEndDate: attendee.event.endDate,
          eventLocation: attendee.event.location,
          qr,
          code: attendee.code.code,
          codeUsed: attendee.code.used,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendee',
      error: error.message,
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