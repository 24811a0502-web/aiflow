const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const BCRYPT_SALT_ROUNDS = 12;

class AuthService {
  async register({ name, email, password, role = 'operator' }) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const err = new Error('User already exists with this email address');
      err.status = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'operator',
      lastLogin: new Date(),
    });

    const token = this.generateToken(user);
    const userResponse = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    return { user: userResponse, token };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    // For Mongoose or in-memory, retrieve user
    let user = null;
    if (User.collection instanceof Map) {
      for (const item of User.collection.values()) {
        if (item.email === normalizedEmail) {
          user = item;
          break;
        }
      }
    } else {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    }

    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id || user.id,
      { lastLogin: new Date() },
      { new: true }
    );

    const token = this.generateToken(user);
    const userResponse = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: updatedUser?.lastLogin || new Date(),
      createdAt: user.createdAt,
    };

    return { user: userResponse, token };
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
  }
}

module.exports = new AuthService();
