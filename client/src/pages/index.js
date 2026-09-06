import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Boxes,
  Workflow,
  CheckCircle2,
  RefreshCcw,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  const agents = [
    {
      name: 'Planner Agent',
      badge: 'TOPOLOGICAL PLANNER',
      desc: 'Validates DAG structure, detects cycles, calculates dependency ordering, and emits confidence scores.',
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    },
    {
      name: 'Execution Agent',
      badge: 'TASK DISPATCHER',
      desc: 'Executes individual actions across Gmail, Slack, Discord, Google Sheets, or LLMs with context resolution.',
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    },
    {
      name: 'Validation Agent',
      badge: 'CONTRACT GUARDIAN',
      desc: 'Verifies required output fields and API response schemas before downstream step handoff.',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    },
    {
      name: 'Recovery Agent',
      badge: 'RESILIENCE ENGINE',
      desc: 'Classifies failures into discrete taxonomy and decides between exponential backoff retries and human escalation.',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    },
    {
      name: 'Monitoring Agent',
      badge: 'EVENT STREAMER',
      desc: 'Streams real-time step events to WebSocket subscribers and logs persistent audit trails to MongoDB.',
      color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <Head>
        <title>Agentflow_AI – Next-Gen Agentic Operations Platform</title>
      </Head>

      {/* Navigation Header */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
            Agentflow<span className="text-blue-500">_AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition duration-150"
            >
              Open Console <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition duration-150"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Multi-Agent Operations Automation
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Describe the workflow. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            AI Agents execute the rest.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Agentflow_AI transforms natural language prompts into live visual graphs on a drag-and-drop canvas,
          orchestrated by a deterministic chain of cooperating AI agents with self-healing recovery and live WebSocket streaming.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 transition duration-150"
          >
            Launch Prompt Builder <Sparkles className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base transition duration-150"
          >
            Operator Login
          </Link>
        </div>
      </section>

      {/* Cooperating Agents Showcase */}
      <section className="px-6 py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Agentic Orchestration Substrate
            </span>
            <h2 className="text-3xl font-bold text-white mt-2">
              Fixed Chain of 5 Autonomous Agents
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Every workflow execution runs through a cooperative pipeline ensuring validation, fault-tolerance, and live observability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-sm relative hover:border-slate-700 transition"
              >
                <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border mb-3 ${agent.color}`}>
                  {agent.badge}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
            {/* LangGraph Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 relative">
              <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/40 bg-indigo-500/20 text-indigo-300 mb-3">
                ORCHESTRATION LAYER
              </span>
              <h3 className="text-lg font-bold text-white mb-2">LangGraph &amp; BullMQ</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Seamless background job scheduling via BullMQ on Redis with graceful zero-dependency in-memory queue fallback for local development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Agentflow_AI. Agentic Operations Automation Platform. Built to spec.</p>
      </footer>
    </div>
  );
}
