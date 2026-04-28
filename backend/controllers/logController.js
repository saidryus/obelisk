const Log = require('../models/Log');

/** GET /api/logs — return activity logs for the logged-in user */
async function getLogs(req, res) {
  try {
    const logs = await Log.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(100); // cap at 100 entries for the demo
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getLogs };
