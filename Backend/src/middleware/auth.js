const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const User = require('../models/User');

function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parts = raw.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const cookieToken = readCookie(req, 'access_token');
  const headerToken = header && header.startsWith('Bearer ') ? header.replace('Bearer ', '') : null;
  const token = cookieToken || headerToken;
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = { requireAuth };
