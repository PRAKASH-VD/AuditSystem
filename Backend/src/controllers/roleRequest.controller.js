const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { nanoid } = require('nanoid');
const { env } = require('../config/env');
const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');

async function listRoleRequests(req, res, next) {
  try {
    const { status, requestedRole, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (requestedRole) query.requestedRole = requestedRole;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      RoleRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      RoleRequest.countDocuments(query)
    ]);

    return res.json({ items, page: pageNum, limit: limitNum, total });
  } catch (err) {
    return next(err);
  }
}

async function updateRoleRequest(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['approved', 'denied', 'pending', 'sent', 'failed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const request = await RoleRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (status === 'approved') {
      let user = await User.findOne({ email: request.email });
      if (!user) {
        const tempPassword = nanoid(10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        user = await User.create({
          name: request.name,
          email: request.email,
          role: request.requestedRole,
          passwordHash,
          mustResetPassword: true
        });

        if (env.SMTP_USER && env.SMTP_PASS) {
          const transporter = nodemailer.createTransport({
            host: env.SMTP_HOST || 'smtp.gmail.com',
            port: env.SMTP_PORT || 465,
            secure: true,
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS
            }
          });
          await transporter.sendMail({
            from: env.SMTP_USER,
            to: request.email,
            subject: 'Your access request was approved',
            text: [
              `Hello ${request.name},`,
              '',
              `Your ${request.requestedRole} access has been approved.`,
              `Temporary password: ${tempPassword}`,
              'Please log in and change your password.'
            ].join('\n')
          });
        }
      } else {
        user.role = request.requestedRole;
        await user.save();
      }
    }

    request.status = status;
    const updated = await request.save();
    if (!updated) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(updated.toObject());
  } catch (err) {
    return next(err);
  }
}

module.exports = { listRoleRequests, updateRoleRequest };
