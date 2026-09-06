const mongoose = require('mongoose');
const { createModel } = require('./modelAdapter');

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
    },
    triggerConfig: {
      type: Object,
      default: { type: 'manual', config: {} },
    },
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    version: { type: Number, default: 1 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const MongooseWorkflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
const Workflow = createModel('workflows', MongooseWorkflow);

module.exports = Workflow;
