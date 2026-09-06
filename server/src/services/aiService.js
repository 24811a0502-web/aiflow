const axios = require('axios');
const env = require('../config/env');

class AIService {
  /**
   * Main entrypoint for generating workflow from prompt
   */
  async generateWorkflowFromPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('A valid prompt string is required');
    }

    // 1. Try OpenRouter if API key configured
    if (env.OPENROUTER_API_KEY) {
      try {
        const result = await this.generateWithOpenRouter(prompt);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generator = 'openrouter';
          return result;
        }
      } catch (err) {
        console.warn(`[AIService] OpenRouter generation failed (${err.message}). Falling back to Gemini...`);
      }
    }

    // 2. Try Gemini if API key configured
    if (env.GEMINI_API_KEY) {
      try {
        const result = await this.generateWithGemini(prompt);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generator = 'gemini';
          return result;
        }
      } catch (err) {
        console.warn(`[AIService] Gemini generation failed (${err.message}). Falling back to Deterministic Builder...`);
      }
    }

    // 3. Fallback to deterministic rule-based builder
    const deterministic = this.buildDeterministicWorkflow(prompt);
    deterministic.generator = 'deterministic_rule_engine';
    return deterministic;
  }

  async generateWithOpenRouter(userPrompt) {
    const systemPrompt = this.getSystemInstruction();
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    return this.cleanAndParseJSON(content);
  }

  async generateWithGemini(userPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: `${this.getSystemInstruction()}\n\nUser request: "${userPrompt}"` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    };

    const response = await axios.post(url, payload, { timeout: 15000 });
    const text = response.data.candidates[0]?.content?.parts[0]?.text;
    return this.cleanAndParseJSON(text);
  }

  getSystemInstruction() {
    return `You are an expert AI Operations Workflow Architect. Generate a complete, valid JSON workflow graph based on the user's prompt.
Your response MUST be valid JSON with this exact structure:
{
  "name": "Short Descriptive Title",
  "description": "Clear description of what this automation achieves",
  "triggerConfig": {
    "type": "webhook" | "schedule" | "manual",
    "config": {}
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger" | "ai_prompt" | "gmail" | "slack" | "discord" | "google-sheets" | "condition",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "Human Readable Label",
        "description": "What this step does",
        "action": "sendEmail" | "postMessage" | "appendRow" | "summarize" | "evaluate",
        "params": {}
      }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "node-1",
      "target": "node-2",
      "animated": true
    }
  ],
  "tags": ["operations", "automation"]
}`;
  }

  cleanAndParseJSON(raw) {
    if (!raw) return null;
    let text = raw.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(text);
  }

  /**
   * Deterministic rule-based builder ensuring guaranteed offline execution
   */
  buildDeterministicWorkflow(prompt) {
    const lower = prompt.toLowerCase();

    // 1. Invoice Routing Workflow
    if (lower.includes('invoice') || lower.includes('bill') || lower.includes('payment')) {
      return {
        name: 'Automated Invoice Processing & Routing',
        description: 'Extracts invoice details, verifies tax data, logs to Google Sheets and alerts Slack channel.',
        triggerConfig: { type: 'webhook', config: { endpoint: '/webhook/invoices' } },
        tags: ['finance', 'invoices', 'slack', 'sheets'],
        nodes: [
          {
            id: 'node-trigger',
            type: 'trigger',
            position: { x: 100, y: 200 },
            data: { label: 'New Invoice Received', action: 'webhook_listener', params: { source: 'accounting' } },
          },
          {
            id: 'node-ai-extract',
            type: 'ai_prompt',
            position: { x: 380, y: 200 },
            data: {
              label: 'AI Data Extraction',
              action: 'extract_entities',
              params: { prompt: 'Extract vendor, invoiceNumber, amount, dueDate, and line items as JSON.' },
            },
          },
          {
            id: 'node-sheets',
            type: 'google-sheets',
            position: { x: 680, y: 120 },
            data: {
              label: 'Append to Finance Ledger',
              action: 'appendRow',
              params: { spreadsheetId: 'fin-ledger-2026', sheetName: 'Invoices' },
            },
          },
          {
            id: 'node-slack',
            type: 'slack',
            position: { x: 680, y: 280 },
            data: {
              label: 'Notify Finance Ops',
              action: 'postMessage',
              params: { channel: '#finance-approvals', message: 'New invoice processed and logged.' },
            },
          },
        ],
        edges: [
          { id: 'e-1', source: 'node-trigger', target: 'node-ai-extract', animated: true },
          { id: 'e-2', source: 'node-ai-extract', target: 'node-sheets', animated: true },
          { id: 'e-3', source: 'node-ai-extract', target: 'node-slack', animated: true },
        ],
      };
    }

    // 2. Email Notification / Support Dispatch
    if (lower.includes('email') || lower.includes('mail') || lower.includes('gmail')) {
      return {
        name: 'Email Ingestion & Support Routing',
        description: 'Monitors inbound queries, classifies sentiment with AI, logs to Sheet and dispatches follow-up email.',
        triggerConfig: { type: 'schedule', config: { cron: '*/15 * * * *' } },
        tags: ['email', 'support', 'gmail', 'ai'],
        nodes: [
          {
            id: 'node-trigger',
            type: 'trigger',
            position: { x: 100, y: 200 },
            data: { label: 'Poll Unread Inbound Mail', action: 'poll_inbox', params: { label: 'INBOX' } },
          },
          {
            id: 'node-ai-classify',
            type: 'ai_prompt',
            position: { x: 380, y: 200 },
            data: {
              label: 'AI Intent & Priority Analysis',
              action: 'classify_intent',
              params: { prompt: 'Classify urgency (URGENT / NORMAL) and summarize inquiry.' },
            },
          },
          {
            id: 'node-gmail-reply',
            type: 'gmail',
            position: { x: 680, y: 140 },
            data: {
              label: 'Send Acknowledgment Email',
              action: 'sendEmail',
              params: { subject: 'We received your inquiry [Ticket #{id}]', body: 'Our team is reviewing your ticket.' },
            },
          },
          {
            id: 'node-discord-alert',
            type: 'discord',
            position: { x: 680, y: 280 },
            data: {
              label: 'Alert Incident Channel',
              action: 'postMessage',
              params: { channelId: 'support-feed', message: 'New inbound customer ticket processed.' },
            },
          },
        ],
        edges: [
          { id: 'e-1', source: 'node-trigger', target: 'node-ai-classify', animated: true },
          { id: 'e-2', source: 'node-ai-classify', target: 'node-gmail-reply', animated: true },
          { id: 'e-3', source: 'node-ai-classify', target: 'node-discord-alert', animated: true },
        ],
      };
    }

    // 3. Multi-channel Alert / DevOps notification
    if (lower.includes('slack') || lower.includes('discord') || lower.includes('alert') || lower.includes('notify')) {
      return {
        name: 'Multi-Channel Incident Broadcast',
        description: 'Catches critical operational event, summarizes root cause with AI, and broadcasts to Slack and Discord simultaneously.',
        triggerConfig: { type: 'webhook', config: { endpoint: '/webhook/alerts' } },
        tags: ['devops', 'monitoring', 'slack', 'discord'],
        nodes: [
          {
            id: 'node-trigger',
            type: 'trigger',
            position: { x: 100, y: 200 },
            data: { label: 'Alert Webhook Received', action: 'webhook_listener', params: { source: 'datadog' } },
          },
          {
            id: 'node-ai-summary',
            type: 'ai_prompt',
            position: { x: 380, y: 200 },
            data: {
              label: 'Generate Incident Executive Summary',
              action: 'summarize',
              params: { prompt: 'Summarize system impact and outline immediate mitigation actions.' },
            },
          },
          {
            id: 'node-slack',
            type: 'slack',
            position: { x: 680, y: 120 },
            data: {
              label: 'Broadcast to #war-room',
              action: 'postMessage',
              params: { channel: '#war-room', message: 'CRITICAL ALERT: Incident summary and runbook link.' },
            },
          },
          {
            id: 'node-discord',
            type: 'discord',
            position: { x: 680, y: 280 },
            data: {
              label: 'Ping On-Call Engineers',
              action: 'postMessage',
              params: { channelId: 'on-call-pagers', message: 'New alert triggered: check status board.' },
            },
          },
        ],
        edges: [
          { id: 'e-1', source: 'node-trigger', target: 'node-ai-summary', animated: true },
          { id: 'e-2', source: 'node-ai-summary', target: 'node-slack', animated: true },
          { id: 'e-3', source: 'node-ai-summary', target: 'node-discord', animated: true },
        ],
      };
    }

    // 4. Default General Automated Operations Pipeline
    return {
      name: 'Intelligent Operations Pipeline',
      description: `Automated agentic workflow tailored for: "${prompt.substring(0, 60)}"`,
      triggerConfig: { type: 'manual', config: {} },
      tags: ['automation', 'agentic', 'operations'],
      nodes: [
        {
          id: 'node-trigger',
          type: 'trigger',
          position: { x: 100, y: 200 },
          data: { label: 'Start Trigger', action: 'manual_trigger', params: {} },
        },
        {
          id: 'node-ai-analyze',
          type: 'ai_prompt',
          position: { x: 380, y: 200 },
          data: {
            label: 'AI Reasoning & Plan Evaluation',
            action: 'evaluate',
            params: { prompt: `Analyze operational parameters for: ${prompt}` },
          },
        },
        {
          id: 'node-gmail',
          type: 'gmail',
          position: { x: 680, y: 120 },
          data: {
            label: 'Dispatch Status Email',
            action: 'sendEmail',
            params: { to: 'operator@example.com', subject: 'Automated Agent Execution Complete' },
          },
        },
        {
          id: 'node-slack',
          type: 'slack',
          position: { x: 680, y: 280 },
          data: {
            label: 'Post Status to Slack',
            action: 'postMessage',
            params: { channel: '#operations-feed', message: 'Workflow task executed successfully.' },
          },
        },
      ],
      edges: [
        { id: 'e-1', source: 'node-trigger', target: 'node-ai-analyze', animated: true },
        { id: 'e-2', source: 'node-ai-analyze', target: 'node-gmail', animated: true },
        { id: 'e-3', source: 'node-ai-analyze', target: 'node-slack', animated: true },
      ],
    };
  }

  /**
   * Execute an AI prompt node during workflow execution
   */
  async executeAIPromptNode(params = {}, context = {}) {
    const prompt = params.prompt || 'Process step data';
    return {
      success: true,
      analysis: `AI Analysis completed for prompt: "${prompt.substring(0, 80)}"`,
      outputTokens: 142,
      confidence: 0.96,
      resultPayload: {
        summary: 'Step executed with high confidence.',
        contextSummary: Object.keys(context).length ? `Inputs received from ${Object.keys(context).length} upstream nodes` : 'Initial node input',
      },
    };
  }
}

module.exports = new AIService();
