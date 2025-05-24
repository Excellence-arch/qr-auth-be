const mongoose  = require("mongoose");

const accountSchema = new mongoose.Schema({
  name: {type: String},
  username: {type: String},
  password: {type: String},
  email: {type: String},
  role: {type: String}
})

module.exports = mongoose.model('Account', accountSchema);