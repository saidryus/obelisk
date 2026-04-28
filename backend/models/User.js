const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
  role:     { type: String, enum: ['admin', 'employee'], default: 'employee' },

  // Brute-force protection fields
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil:           { type: Date,   default: null },
  lockCount:           { type: Number, default: 0 },  // escalating lockout counter

  createdAt: { type: Date, default: Date.now }
});

// Helper: is account currently locked?
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

module.exports = mongoose.model('User', userSchema);
