const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { logAction } = require('../utils/logger');

const MAX_ATTEMPTS = 5;

/**
 * Progressive lockout durations (in minutes) based on how many times
 * the account has been locked before.
 *
 * lockCount 0 → first lockout  → 10 min
 * lockCount 1 → second lockout → 20 min
 * lockCount 2 → third lockout  → 40 min
 * lockCount 3+ → all subsequent → 60 min (cap)
 */
const LOCK_DURATIONS_MIN = [10, 20, 40, 60];

function getLockDuration(lockCount) {
  const idx = Math.min(lockCount, LOCK_DURATIONS_MIN.length - 1);
  return LOCK_DURATIONS_MIN[idx] * 60 * 1000; // convert to ms
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      await logAction(null, 'FAILED_LOGIN', `Unknown username: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Account currently locked?
    if (user.isLocked) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      await logAction(user._id, 'FAILED_LOGIN', `Account locked (lockout #${user.lockCount})`);
      return res.status(403).json({
        message: `Account locked. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        // Escalate: increment lockCount BEFORE calculating duration
        user.lockCount           = (user.lockCount || 0) + 1;
        const duration           = getLockDuration(user.lockCount - 1); // 0-indexed
        user.lockUntil           = new Date(Date.now() + duration);
        user.failedLoginAttempts = 0;

        const durationMin = Math.round(duration / 60 / 1000);
        await user.save();
        await logAction(user._id, 'FAILED_LOGIN',
          `Locked for ${durationMin} min (lockout #${user.lockCount})`);

        return res.status(403).json({
          message: `Too many failed attempts. Account locked for ${durationMin} minutes.`
        });
      }

      await user.save();
      const remaining = MAX_ATTEMPTS - user.failedLoginAttempts;
      await logAction(user._id, 'FAILED_LOGIN',
        `Attempt ${user.failedLoginAttempts}/${MAX_ATTEMPTS}`);

      return res.status(401).json({
        message: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
      });
    }

    // Successful login — reset ALL counters including lockCount
    user.failedLoginAttempts = 0;
    user.lockUntil           = null;
    user.lockCount           = 0;  // successful login forgives escalation history
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await logAction(user._id, 'LOGIN_ATTEMPT', 'Successful login');

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/auth/verify-password
 * Re-authentication for sensitive actions.
 */
async function verifyPassword(req, res) {
  const { password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await logAction(user._id, 'FAILED_REAUTH', 'Wrong password on re-auth');
      return res.status(401).json({ message: 'Incorrect password' });
    }

    await logAction(user._id, 'REAUTH_SUCCESS', 'Re-authentication passed');
    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login, verifyPassword };
