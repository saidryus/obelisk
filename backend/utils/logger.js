const Log = require('../models/Log');

/**
 * Saves an activity log entry to the database.
 * @param {string|null} userId  - MongoDB ObjectId of the user (or null for anonymous)
 * @param {string}      action  - Action constant e.g. 'LOGIN_ATTEMPT'
 * @param {string}      detail  - Optional human-readable detail
 */
async function logAction(userId, action, detail = '') {
  try {
    await Log.create({ userId, action, detail });
  } catch (err) {
    // Logging should never crash the app
    console.error('Logger error:', err.message);
  }
}

module.exports = { logAction };
