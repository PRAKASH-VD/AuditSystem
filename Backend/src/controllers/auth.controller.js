const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const User = require('../models/User');
const RoleRequest = require('../models/RoleRequest');

const requestWindowMs = 10 * 60 * 1000;
const requestTracker = new Map();
const authCookieName = 'access_token';

function authCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user._id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });
    res.cookie(authCookieName, token, authCookieOptions());
    return res.json({ message: 'Authenticated' });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res) {
  res.clearCookie(authCookieName, {
    ...authCookieOptions(),
    expires: new Date(0)
  });
  return res.json({ message: 'Logged out' });
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { passwordHash, mustResetPassword: false },
      { new: true }
    ).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json({ message: 'Password updated', user });
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Not found' });
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustResetPassword = false;
    await user.save();
    return res.json({ message: 'Password updated' });
  } catch (err) {
    return next(err);
  }
}

async function requestRole(req, res, next) {
  try {
    const { name, email, requestedRole, message } = req.body;
    const source = req.headers['x-request-source'] || 'login';
    const now = Date.now();
    const last = requestTracker.get(email);
    if (last && now - last < requestWindowMs) {
      return res.status(429).json({ message: 'Please wait before submitting another request.' });
    }
    requestTracker.set(email, now);

    if (!env.SMTP_USER || !env.SMTP_PASS || !env.ADMIN_EMAIL) {
      await RoleRequest.create({
        name,
        email,
        requestedRole,
        message,
        source,
        status: 'failed'
      });
      return res.status(500).json({ message: 'Email service not configured' });
    }

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });

    const subject = `Role Request: ${requestedRole} access`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Requested Role: ${requestedRole}`,
      '',
      `Message: ${message || 'N/A'}`
    ].join('\n');

    await transporter.sendMail({
      from: env.SMTP_USER,
      to: env.ADMIN_EMAIL,
      subject,
      text: body
    });

    await RoleRequest.create({
      name,
      email,
      requestedRole,
      message,
      source,
      status: 'sent'
    });

    return res.json({ message: 'Request sent' });
  } catch (err) {
    try {
      const { name, email, requestedRole, message } = req.body || {};
      await RoleRequest.create({
        name: name || 'Unknown',
        email: email || 'unknown@domain.com',
        requestedRole: requestedRole || 'viewer',
        message,
        source: req.headers['x-request-source'] || 'login',
        status: 'failed'
      });
    } catch (_) {
      // ignore logging failures
    }
    return next(err);
  }
}

module.exports = { login, logout, me, requestRole, resetPassword, changePassword };
