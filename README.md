# Agentflow_AI – Agentic AI Operations Automation Platform

An enterprise-grade, full-stack AI Operations Automation Platform that lets operators describe automations in natural language and transforms them into executable visual workflows. Powered by a deterministic chain of 5 cooperating AI agents, visual drag-and-drop canvas editing via React Flow, hardware-grade token encryption, third-party OAuth integrations (Gmail, Slack, Discord, Google Sheets), and real-time WebSocket timeline streaming.

---

## 🌟 Key Capabilities

- **Natural Language Workflow Architect:** Type any operational prompt (e.g. *"Extract invoice details, append to Google Sheets, and notify #war-room on Slack"*) $\rightarrow$ generates a complete DAG with positions, coordinates, and node parameters.
- **3-Tier AI Generation Resiliency:** Prefers **OpenRouter** when configured $\rightarrow$ falls back to **Google Gemini** $\rightarrow$ falls back to a built-in **Deterministic Rule Engine** (guaranteeing 100% operational capability with zero external API keys needed!).
- **Fixed Chain of 5 Autonomous Agents:**
  1. **Planner Agent:** Topologically sorts workflow DAG, checks for cycles, and emits confidence scores.
  2. **Execution Agent:** Dispatches node actions across integrations or AI providers with execution context parameter interpolation (`{{node-1.summary}}`).
  3. **Validation Agent:** Inspects output schemas and contracts before subsequent step handoffs.
  4. **Recovery Agent:** Classifies failures into discrete taxonomy (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and coordinates exponential backoff retries vs operator escalation.
  5. **Monitoring Agent:** Emits real-time Socket.IO execution events and logs persistent audit trails to MongoDB.
- **Interactive Visual Canvas:** Built with React Flow (`@xyflow/react`), animated edges, drag-and-drop node palette, and side-panel parameter configuration.
- **Third-Party Integrations & Security:** Gmail, Slack, Discord, and Google Sheets with credentials encrypted at rest using **AES-256-GCM** via `CREDENTIAL_ENCRYPTION_KEY`.
- **Zero-Dependency Fallbacks for Instant Local Development:**
  - Automatic In-Memory Store fallback if MongoDB is not running.
  - Automatic In-Memory Queue fallback if Redis is not running.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, React Flow (`@xyflow/react`), Socket.IO client, Lucide React icons |
| **Backend** | Node.js, Express, MongoDB & Mongoose (with in-memory fallback), BullMQ (via ioredis with in-memory queue fallback), Socket.IO, Helmet, Morgan, Compression, Express-Validator, Express-Rate-Limit, Bcrypt.js |
| **AI Orchestration** | OpenRouter API, Google Generative AI (Gemini), LangChain / LangGraph substrate reporting |
| **Integrations** | Gmail, Slack, Discord, Google Sheets |
| **Security** | AES-256-GCM token encryption at rest, JWT authentication (bcrypt cost factor 12) |

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- *(Optional)* **MongoDB**: If not installed, Agentflow automatically boots an in-memory document database.
- *(Optional)* **Redis**: If not installed, Agentflow automatically runs an in-memory asynchronous execution queue.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone or Navigate to Project Root
```bash
cd "c:\Users\Sagar Adari\OneDrive\Desktop\Projects Folder"
```

### 2. Install Dependencies
You can install dependencies for both `server` and `client` at once from the root directory:
```bash
npm run install:all
```
*(Or install individually)*:
```bash
cd server && npm install
cd ../client && npm install
```

---

### 3. Environment Configuration

Default configuration files (`server/.env` and `client/.env.local`) are pre-created so you can run immediately with zero friction!

#### Backend Configuration (`server/.env`)
```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/agentflow
JWT_SECRET=super_secret_agentflow_jwt_key_32_characters_minimum!
JWT_EXPIRES_IN=7d
CREDENTIAL_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
REDIS_URL=redis://localhost:6379

# Optional AI API Keys (leave blank to use the deterministic builder)
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# Optional OAuth Client Credentials
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=
```

#### Frontend Configuration (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

### 4. Running Locally

You can launch both the backend server and frontend client concurrently:

```bash
npm run dev
```

Or run each service in separate terminal windows:

#### Terminal 1: Backend Server (Port 5000)
```bash
cd server
npm run dev
```

#### Terminal 2: Frontend Client (Port 3000)
```bash
cd client
npm run dev
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🧑‍💻 Operator Walkthrough

### 1. Initial Login & Registration
- Visit `http://localhost:3000` and click **Get Started** or navigate to `/login`.
- A default operator account can be registered at `/register` or you can log in with:
  - **Email:** `operator@agentflow.io`
  - **Password:** `password123`
- Session authentication is managed via JSON Web Tokens with Zustand client hydration and auto-redirect.

### 2. Operations Console (`/dashboard`)
- Real-time `MetricGrid` showing **Active Workflows**, **Total Executions**, **Success Rate %**, and **Recovery Stats**.
- Recent execution summary cards with live status indicators.
- Live **AI Agent Stream** panel displaying events from the agent pipeline in real time.

### 3. Natural Language Workflow Architect (`/workflows/builder`)
- Type any automation prompt into the input box or click one of the pre-configured prompt starters:
  - *"Extract customer invoice data with AI, append rows to Google Sheets, and notify finance channel on Slack"*
  - *"Ingest inbound customer support emails, classify intent with AI, and dispatch Discord alert to on-call"*
  - *"Catch critical Datadog alerts via webhook, summarize incident root cause, and broadcast to war-room Slack channel"*
- Click **Synthesize Workflow** $\rightarrow$ watches the multi-node graph render on the canvas.
- Click **Open in Canvas Editor** to fine-tune or **Execute Run** to dispatch immediately.

### 4. Full Visual Canvas Editor (`/workflows/[id]`)
- **Left Pane (Node Palette):** Drag-and-drop or click to insert nodes (Trigger, AI Reasoning, Gmail, Slack, Discord, Google Sheets, Condition Gate).
- **Center Pane (React Flow Canvas):** Zoom, pan, connect nodes with animated edges, and inspect the topological flow.
- **Right Pane (Node Config Panel):** Click any node to customize labels, actions, parameters (recipient, message, sheet ID, AI prompt), or delete the step.
- **Header Controls:** Edit workflow title, change status (`draft` / `active` / `paused`), save graph (`Ctrl+S`), and execute runs.

### 5. Live Execution Timeline (`/executions/[id]`)
- Streams real-time events via **Socket.IO** room subscriptions.
- Shows discrete color-coded badges for each agent:
  - <span style="color:#60a5fa">**PLANNER**</span>: Topological ordering & confidence score.
  - <span style="color:#c084fc">**EXECUTION**</span>: Node dispatch & context resolution.
  - <span style="color:#34d399">**VALIDATION**</span>: Contract and schema checks.
  - <span style="color:#fbbf24">**RECOVERY**</span>: Error classification and retry backoff.
  - <span style="color:#22d3ee">**MONITORING**</span>: Timeline logging & notifications.
- Interactive lifecycle controls to **Pause**, **Resume**, or **Cancel** running workflows.

### 6. Integrations Hub (`/integrations`)
- Displays status cards for **Gmail**, **Slack**, **Discord**, and **Google Sheets**.
- Supports OAuth consent start and callback handling.
- Provides a quick manual credential modal for instant local testing.
- Token encryption at rest using AES-256-GCM.

### 7. Platform Health & Settings (`/settings`)
- View operator profile details and assigned role (`admin` or `operator`).
- Health checks for `CREDENTIAL_ENCRYPTION_KEY`, Database substrate, and LangGraph substrate.

---

## 📡 REST API Reference

All endpoints (except `/api/health` and public auth) require the header `Authorization: Bearer <JWT_TOKEN>`.

### Heartbeat & Auth
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System heartbeat, database mode, queue mode, LangGraph status |
| `POST` | `/api/auth/register` | Register new operator account |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Fetch active profile |

### Workflows
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workflows/dashboard` | Aggregated metrics and recent execution runs |
| `GET` | `/api/workflows` | List workflows with search and status filtering |
| `POST` | `/api/workflows` | Create a new workflow manually |
| `POST` | `/api/workflows/generate` | AI prompt-to-workflow graph synthesis |
| `GET` | `/api/workflows/:id` | Get single workflow details |
| `PUT` | `/api/workflows/:id` | Update workflow structure and bump version |
| `POST` | `/api/workflows/:id/duplicate` | Clone an existing workflow |
| `POST` | `/api/workflows/:id/execute` | Queue an execution run |
| `DELETE` | `/api/workflows/:id` | Delete workflow |

### Executions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/executions` | List all executions with filtering |
| `GET` | `/api/executions/:id` | Get execution snapshot and details |
| `GET` | `/api/executions/:id/timeline` | Get granular agent timeline event logs |
| `POST` | `/api/executions/:id/pause` | Pause an active run |
| `POST` | `/api/executions/:id/resume` | Resume a paused run |
| `POST` | `/api/executions/:id/cancel` | Cancel an active run |

### Integrations & Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/integrations` | List integration connection statuses |
| `GET` | `/api/integrations/oauth/:provider/start` | Initiate OAuth flow |
| `GET` | `/api/integrations/oauth/:provider/callback` | OAuth callback handler |
| `POST` | `/api/integrations` | Manual credential setup |
| `DELETE` | `/api/integrations/:provider` | Disconnect integration |
| `GET` | `/api/notifications` | List user notifications |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `POST` | `/api/notifications/read-all` | Mark all notifications as read |

---

## 📂 Architecture & Folder Layout

```
Projects Folder/
├── spec.md                          # Single source of truth specifications
├── README.md                        # Local setup & operator instructions
├── package.json                     # Orchestration scripts (npm run dev, etc.)
│
├── server/                          # Backend Node.js & Express API
│   ├── .env                         # Server environment configuration
│   └── src/
│       ├── config/                  # env.js, db.js, socket.js
│       ├── models/                  # User, Workflow, Execution, ExecutionLog, Integration, Notification
│       ├── routes/                  # authRoutes, workflowRoutes, executionRoutes, integrationRoutes, notificationRoutes
│       ├── controllers/             # authController, workflowController, executionController, integrationController, notificationController
│       ├── services/                # authService, workflowService, executionService, aiService, integrationService, cryptoService
│       ├── agents/                  # orchestrator, plannerAgent, executionAgent, validationAgent, recoveryAgent, monitoringAgent
│       ├── integrations/            # baseIntegration, gmailIntegration, slackIntegration, discordIntegration, googleSheetsIntegration
│       ├── queues/                  # executionQueue (BullMQ + in-memory fallback)
│       └── server.js                # Express & Socket.IO server entrypoint
│
└── client/                          # Frontend Next.js Application
    ├── .env.local                   # Client environment configuration
    └── src/
        ├── components/
        │   ├── AppShell/            # Layout, sidebar, notifications drawer
        │   ├── MetricGrid/          # Dashboard metrics & success indicators
        │   ├── NodePalette/         # Draggable node palette
        │   ├── NodeConfigPanel/     # Node parameter editor
        │   ├── WorkflowCanvas/      # React Flow custom nodes & canvas
        │   └── ProtectedRoute/      # Session protection wrapper
        ├── pages/
        │   ├── _app.js              # Global styles & auth hydration
        │   ├── index.js             # Showcase landing page
        │   ├── login.js             # Authentication form
        │   ├── register.js          # Operator registration
        │   ├── dashboard.js         # Metrics, recent runs, live feed
        │   ├── integrations.js      # OAuth connection cards
        │   ├── settings.js          # Profile & security health
        │   ├── executions/          # Execution catalog & live timeline
        │   └── workflows/           # Workflow catalog, AI builder, canvas editor
        ├── store/                   # authStore.js, workflowStore.js
        └── services/                # api.js, socket.js
```

---

## 🛡️ License

Proprietary – Built according to the specification for the Agentic AI Operations Automation Platform.
