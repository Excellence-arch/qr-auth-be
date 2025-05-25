const Ticket = require('../models/Ticket.model');
const Event = require('../models/Event.model');
const Attendee = require('../models/Attendee.model');

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('event', 'name startDate endDate location')
      .populate('attendees', 'name email');

    res.status(200).json({
      status: true,
      message: 'Tickets retrieved successfully',
      data: {
        tickets: tickets.map(ticket => ({
          id: ticket._id,
          name: ticket.name,
          price: ticket.price,
          eventId: ticket.event._id,
          eventName: ticket.event.name,
          attendeesCount: ticket.attendees.length,
        })),
      },
    });
  } catch (error) {
    console.error('Error retrieving tickets:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
}

exports.getTicketById = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const ticket = await Ticket.findById(ticketId)
      .populate('event', 'name startDate endDate location')
      .populate('attendees', 'name email');
    if (!ticket) {
      return res.status(404).json({
        status: false,
        message: 'Ticket not found',
      });
    }
    res.status(200).json({
      status: true,
      message: 'Ticket retrieved successfully',
      data: {
        ticket: {
          id: ticket._id,
          name: ticket.name,
          price: ticket.price,
          eventId: ticket.event._id,
          eventName: ticket.event.name,
          attendeesCount: ticket.attendees.length,
        },
      },
    });
  }
  catch (error) {
    console.error('Error retrieving ticket:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
}

exports.createTicket = async (req, res) => {
  const { name, price, eventId } = req.body;

  try {
    const newTicket = new Ticket({
      name,
      price,
      event: eventId,
    });
    await newTicket.save();
    res.status(201).json({
      status: true,
      message: 'Ticket created successfully',
      data: {
        ticket: {
          id: newTicket._id,
          name: newTicket.name,
          price: newTicket.price,
          eventId: newTicket.event,
        },
      },
    });
  }
  catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

