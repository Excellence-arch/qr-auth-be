const mongoose = require('mongoose');



const ticketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: {type: Number, required: true, default: 0},
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
      },
    ],
  },
  { timestamps: true }
);
const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;