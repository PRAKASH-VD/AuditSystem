const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash').lean();
    return res.json(users);
  } catch (err) {
    return next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listUsers, createUser, updateUserRole };
