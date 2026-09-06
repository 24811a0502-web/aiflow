import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  GitFork,
  Search,
  Plus,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';

export default function WorkflowsIndexPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows', {
        params: { search, status: filterStatus },
      });
      if (res.data.success) {
        setWorkflows(res.data.data.workflows || []);
      }
    } catch (err) {
      console.error('Failed to load workflows', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkflows();
  };

  const handleCreateManual = async () => {
    try {
      const res = await api.post('/workflows', {
        name: 'New Custom Automation',
        description: 'Visual multi-agent operations pipeline',
        nodes: [
          {
            id: 'node-trigger',
            type: 'trigger',
            position: { x: 150, y: 150 },
            data: { label: 'Manual Trigger', action: 'manual', params: {} },
          },
        ],
        edges: [],
      });
      if (res.data.success) {
        const id = res.data.data.workflow.id || res.data.data.workflow._id;
        router.push(`/workflows/${id}`);
      }
    } catch (err) {
      alert('Failed to create workflow: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/duplicate`);
      if (res.data.success) {
        fetchWorkflows();
      }
    } catch (err) {
      alert('Failed to duplicate: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows((prev) => prev.filter((w) => (w.id || w._id) !== id));
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExecute = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/execute`, { inputs: { triggeredVia: 'ui' } });
      if (res.data.success) {
        const execId = res.data.data.execution.id || res.data.data.execution._id;
        router.push(`/executions/${execId}`);
      }
    } catch (err) {
      alert('Execution dispatch failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>Workflows – Agentflow_AI</title>
        </Head>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Automations Catalog</h1>
              <p className="text-xs text-slate-400 mt-1">
                Design, execute, and monitor visual workflows across connected systems.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateManual}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 text-slate-400" /> New Blank Canvas
              </button>
              <Link
                href="/workflows/builder"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition"
              >
                <Sparkles className="w-4 h-4" /> AI Prompt Builder
              </Link>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows by name..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </form>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {['all', 'draft', 'active', 'paused'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    filterStatus === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Workflows Grid */}
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              Loading workflows catalog...
            </div>
          ) : workflows.length === 0 ? (
            <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
              <GitFork className="w-10 h-10 text-slate-700" />
              <p>No workflows match your criteria.</p>
              <Link
                href="/workflows/builder"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-md shadow-blue-500/20"
              >
                Generate one with AI
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workflows.map((wf) => {
                const id = wf.id || wf._id;
                return (
                  <div
                    key={id}
                    onClick={() => router.push(`/workflows/${id}`)}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-blue-500/50 backdrop-blur-md flex flex-col justify-between cursor-pointer transition-all duration-200 group hover:shadow-xl hover:shadow-blue-500/5"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            wf.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {wf.status || 'draft'}
                        </span>
                        <span className="text-[10px] text-slate-500">v{wf.version || 1}.0</span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition mb-1 truncate">
                        {wf.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {wf.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {wf.nodes?.length || 0} nodes
                        </span>
                        <span>•</span>
                        <span>Trigger: {wf.triggerConfig?.type || 'manual'}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleExecute(id, e)}
                          title="Execute Run"
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(id, e)}
                          title="Duplicate Workflow"
                          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(id, e)}
                          title="Delete Workflow"
                          className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs text-blue-400 group-hover:translate-x-0.5 transition flex items-center gap-1 font-medium">
                        Open Canvas <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
