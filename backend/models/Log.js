const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:    { type: String, required: true }, // e.g. LOGIN_ATTEMPT, CREATE_SECRET
  detail:    { type: String, default: '' },    // optional extra info
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
