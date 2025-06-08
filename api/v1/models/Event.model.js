const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: false },
    endTime: { type: String },
    location: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'active'],
      default: 'upcoming',
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
      },
    ],
    codes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Code',
      },
    ],
    registrars: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    image: { type: String },
    capacity: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
