import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Activity,
  ArrowLeft,
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  GitFork,
  Terminal,
  Cpu,
} from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';
import { subscribeToExecution, unsubscribeFromExecution } from '../../services/socket';

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExecution = async () => {
    if (!id) return;
    try {
      const [execRes, timelineRes] = await Promise.all([
        api.get(`/executions/${id}`),
        api.get(`/executions/${id}/timeline`),
      ]);
      if (execRes.data.success) {
        setExecution(execRes.data.data.execution);
      }
      if (timelineRes.data.success) {
        setTimeline(timelineRes.data.data.timeline || []);
      }
    } catch (err) {
      console.error('Failed to load execution details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecution();

    if (!id) return;

    // Connect to Socket.IO room for live agent stream
    const handleNewAgentEvent = (event) => {
      setTimeline((prev) => [...prev, event]);
      // Also refresh execution snapshot if status changed
      if (event.agent === 'monitoring' && (event.message?.includes('completed') || event.message?.includes('failed') || event.message?.includes('cancelled'))) {
        fetchExecution();
      }
    };

    subscribeToExecution(id, handleNewAgentEvent);

    return () => {
      unsubscribeFromExecution(id, handleNewAgentEvent);
    };
  }, [id]);

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/pause`);
      fetchExecution();
    } catch (err) {
      alert('Pause failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/resume`);
      fetchExecution();
    } catch (err) {
      alert('Resume failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this active execution?')) return;
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/cancel`);
      fetchExecution();
    } catch (err) {
      alert('Cancel failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getAgentBadge = (agent) => {
    switch (agent) {
      case 'planner':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
            Planner
          </span>
        );
      case 'execution':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
            Execution
          </span>
        );
      case 'validation':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Validation
          </span>
        );
      case 'recovery':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Recovery
          </span>
        );
      case 'monitoring':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            Monitoring
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
            {agent}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>Execution Timeline – Agentflow_AI</title>
        </Head>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/executions')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {execution?.workflowSnapshot?.name || 'Execution Run'}
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  Execution ID: {id}
                </p>
              </div>
            </div>

            {/* Run Lifecycle Controls: Pause, Resume, Cancel */}
            <div className="flex items-center gap-2">
              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause Run
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5" /> Resume Run
                </button>
              )}

              {(execution?.status === 'RUNNING' || execution?.status === 'PAUSED') && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Square className="w-3.5 h-3.5" /> Cancel Run
                </button>
              )}
            </div>
          </div>

          {/* Status Pod */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Run Status</span>
              <div className="text-sm font-bold text-white mt-1 capitalize">{execution?.status}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Duration</span>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {execution?.duration ? `${execution.duration}ms` : 'In progress'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Retries</span>
              <div className="text-sm font-bold text-white mt-1">
                {execution?.retryCount || 0} attempts
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Current Step</span>
              <div className="text-sm font-bold text-indigo-400 mt-1 truncate">
                {execution?.currentNode || 'None (Completed)'}
              </div>
            </div>
          </div>

          {/* Granular Agent Timeline */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Live Multi-Agent Event Timeline</h2>
              </div>
              <span className="text-xs text-slate-500">{timeline.length} events logged</span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                Loading timeline...
              </div>
            ) : timeline.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                <Clock className="w-8 h-8 text-slate-700" />
                <p>Waiting for agent events to stream...</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {timeline.map((event, idx) => {
                  const isErr = event.level === 'error';
                  const isWarn = event.level === 'warning';
                  const isSucc = event.level === 'success';

                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          isErr
                            ? 'bg-rose-500'
                            : isWarn
                            ? 'bg-amber-500'
                            : isSucc
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                      />

                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 group-hover:border-slate-700 transition space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {getAgentBadge(event.agent)}
                            {event.nodeId && (
                              <span className="text-[11px] font-mono text-slate-400">
                                Node: <strong>{event.nodeId}</strong>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(event.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>

                        <p
                          className={`text-xs leading-relaxed ${
                            isErr
                              ? 'text-red-400 font-medium'
                              : isWarn
                              ? 'text-amber-300'
                              : isSucc
                              ? 'text-emerald-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {event.message}
                        </p>

                        {/* Metadata expandable */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto">
                            <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
