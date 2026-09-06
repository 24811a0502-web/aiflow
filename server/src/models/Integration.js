const mongoose = require('mongoose');
const { createModel } = require('./modelAdapter');

const integrationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.Mixed, required: true },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: { type: Boolean, default: false },
    scopes: [{ type: String }],
    encryptedTokens: {
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      iv: { type: String, default: null },
      authTag: { type: String, default: null },
    },
    expiresAt: { type: Date, default: null },
    config: { type: Object, default: {} },
  },
  { timestamps: true }
);

const MongooseIntegration = mongoose.models.Integration || mongoose.model('Integration', integrationSchema);
const Integration = createModel('integrations', MongooseIntegration);

module.exports = Integration;
