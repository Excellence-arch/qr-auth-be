const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema(
  {
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Code = mongoose.model('Code', codeSchema);

module.exports = Code;
