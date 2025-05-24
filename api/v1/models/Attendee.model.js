const mongoose = require('mongoose');

const attendeeSchema = mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    code: { type: mongoose.Schema.Types.ObjectId, ref: 'Code', required: true },
  },
  { timestamps: true }
);

const Attendee = mongoose.model('Attendee', attendeeSchema);

module.exports = Attendee;
