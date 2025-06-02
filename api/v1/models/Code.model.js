const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema(
  {
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendee',
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
  },
  { timestamps: true }
);

const Code = mongoose.model('Code', codeSchema);

module.exports = Code;
