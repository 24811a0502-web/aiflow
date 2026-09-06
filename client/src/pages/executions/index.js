import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Activity,
  Filter,
  ArrowRight,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pause,
  ExternalLink,
} from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function ExecutionsListPage() {
  const router = useRouter();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/executions', {
        params: { status: statusFilter },
      });
      if (res.data.success) {
        setExecutions(res.data.data.executions || []);
      }
    } catch (err) {
      console.error('Failed to load executions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();

    // Socket live status updates
    const socket = getSocket();
    if (socket) {
      const handleStatusUpdate = (update) => {
        setExecutions((prev) =>
          prev.map((e) =>
            (e.id || e._id) === update.executionId ? { ...e, ...update } : e
          )
        );
      };
      socket.on('execution:update', handleStatusUpdate);
      return () => {
        socket.off('execution:update', handleStatusUpdate);
      };
    }
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" /> Running
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Retrying
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Pause className="w-3.5 h-3.5" /> Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {status || 'Pending'}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>Execution History – Agentflow_AI</title>
        </Head>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Execution History</h1>
              <p className="text-xs text-slate-400 mt-1">
                Audit log of all autonomous agent execution runs, timelines, and recovery events.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['all', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md overflow-hidden shadow-xl">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                Loading executions...
              </div>
            ) : executions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-500 gap-3">
                <Activity className="w-10 h-10 text-slate-700" />
                <p>No executions found matching filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Workflow</th>
                      <th className="px-6 py-3.5 font-bold">Status</th>
                      <th className="px-6 py-3.5 font-bold">Duration</th>
                      <th className="px-6 py-3.5 font-bold">Retries</th>
                      <th className="px-6 py-3.5 font-bold">Started At</th>
                      <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {executions.map((e) => {
                      const id = e.id || e._id;
                      return (
                        <tr
                          key={id}
                          onClick={() => router.push(`/executions/${id}`)}
                          className="hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-xs">
                              {e.workflowSnapshot?.name || 'Automation Workflow'}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {id?.substring(0, 12)}...
                            </span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(e.status)}</td>
                          <td className="px-6 py-4 font-mono text-slate-400">
                            {e.duration ? `${e.duration}ms` : '–'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                e.retryCount > 0
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'text-slate-500'
                              }`}
                            >
                              {e.retryCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(e.startTime || e.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/executions/${id}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              Timeline <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
