const mongoose = require('mongoose');



const ticketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);
const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;