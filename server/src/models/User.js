const mongoose = require('mongoose');
const { createModel } = require('./modelAdapter');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);
const User = createModel('users', MongooseUser);

module.exports = User;
