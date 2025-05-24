const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    date: { type: Date, required: true },
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
    image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
