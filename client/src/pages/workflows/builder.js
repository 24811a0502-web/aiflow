import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Sparkles,
  Play,
  ArrowRight,
  Send,
  Cpu,
  Layers,
  CheckCircle2,
  GitFork,
  Terminal,
} from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';

const samplePrompts = [
  'Extract customer invoice data with AI, append rows to Google Sheets, and notify finance channel on Slack',
  'Ingest inbound customer support emails, classify intent with AI, and dispatch Discord alert to on-call',
  'Catch critical Datadog alerts via webhook, summarize incident root cause, and broadcast to war-room Slack channel',
  'Schedule daily report ingestion, summarize trends with AI, and email executive briefing to operators',
];

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);

  const { setWorkflow, setNodes, setEdges } = useWorkflowStore();

  const handleGenerate = async (selectedPrompt) => {
    const textToUse = selectedPrompt || prompt;
    if (!textToUse.trim()) return;

    setGenerating(true);
    setGeneratedResult(null);

    try {
      const res = await api.post('/workflows/generate', { prompt: textToUse });
      if (res.data.success) {
        const { workflow, generator } = res.data.data;
        setGeneratedResult({ ...workflow, generator });
        setActiveWorkflowId(workflow.id || workflow._id);

        // Populate store for instant interactive preview
        setWorkflow(workflow);
      }
    } catch (err) {
      alert('Generation error: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenInEditor = () => {
    if (activeWorkflowId) {
      router.push(`/workflows/${activeWorkflowId}`);
    }
  };

  const handleExecuteDirectly = async () => {
    if (!activeWorkflowId) return;
    try {
      const res = await api.post(`/workflows/${activeWorkflowId}/execute`);
      if (res.data.success) {
        const execId = res.data.data.execution.id || res.data.data.execution._id;
        router.push(`/executions/${execId}`);
      }
    } catch (err) {
      alert('Failed to execute: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>AI Prompt-to-Workflow Builder – Agentflow_AI</title>
        </Head>

        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          {/* Top Control Bar / Prompt Input Panel */}
          <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white flex items-center gap-2">
                    Natural Language Workflow Architect
                  </h1>
                  <p className="text-xs text-slate-400">
                    Describe any operational automation; AI materializes the graph with coordinates and parameters.
                  </p>
                </div>
              </div>

              {generatedResult && (
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    Generated via: <strong className="text-indigo-400 uppercase">{generatedResult.generator}</strong>
                  </span>
                  <button
                    onClick={handleOpenInEditor}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    Open in Canvas Editor <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleExecuteDirectly}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Execute Run
                  </button>
                </div>
              )}
            </div>

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. When a new customer signs up, send welcome email via Gmail and log to Google Sheets..."
                  className="w-full pl-4 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={generating || !prompt.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Synthesizing Graph...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Synthesize Workflow
                  </>
                )}
              </button>
            </form>

            {/* Quick Templates */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Prompt Starters:
              </span>
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sp);
                    handleGenerate(sp);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap transition"
                >
                  {sp.substring(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Graph Preview Canvas */}
          <div className="flex-1 relative flex">
            {generatedResult ? (
              <WorkflowCanvas />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                  <Terminal className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Canvas Awaiting Prompt</h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  Enter an automation description above or click any starter prompt.
                  The AI architecture engine will generate the nodes, parameters, and topological sequence automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
