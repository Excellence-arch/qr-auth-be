const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../utils/enum.js');

const accountSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String },
    password: { type: String },
    email: { type: String },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    phone: { type: String },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
  },
  { timestamps: true }
);

accountSchema.statics.hashPassword = async function (password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};
accountSchema.statics.comparePassword = async function (password, hash) {
  return await bcrypt.compare(password, hash);
};
accountSchema.statics.generateAuthToken = function (user, rememberMe) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '1h',
  });
  return token;
};
accountSchema.statics.verifyAuthToken = function (token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
