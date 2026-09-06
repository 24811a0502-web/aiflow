import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  GitFork,
  Activity,
  Plus,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import MetricGrid from '../components/MetricGrid';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveAgentFeed, setLiveAgentFeed] = useState([
    {
      id: 'agent-feed-1',
      agent: 'planner',
      message: 'Topological planner validated 4 nodes. Confidence score: 0.98.',
      time: 'Just now',
      level: 'info',
    },
    {
      id: 'agent-feed-2',
      agent: 'monitoring',
      message: 'Background scheduler active via in-memory queue fallback.',
      time: '1m ago',
      level: 'success',
    },
  ]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/workflows/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const socket = getSocket();
    if (socket) {
      const handleLiveEvent = (event) => {
        setLiveAgentFeed((prev) => [
          {
            id: `evt-${Date.now()}`,
            agent: event.agent || 'execution',
            message: event.message,
            time: 'Just now',
            level: event.level || 'info',
          },
          ...prev.slice(0, 10),
        ]);
      };
      socket.on('agent:event', handleLiveEvent);
      return () => {
        socket.off('agent:event', handleLiveEvent);
      };
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>Operations Dashboard – Agentflow_AI</title>
        </Head>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Operations Console
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time status of multi-agent execution pipelines and workflow telemetry.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/workflows/builder"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition"
              >
                <Sparkles className="w-4 h-4" /> Prompt to Workflow
              </Link>
            </div>
          </div>

          {/* Metric Grid */}
          <MetricGrid metrics={dashboardData?.metrics} />

          {/* 2-Column Split: Recent Executions & Live AI Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Executions (2 Cols) */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-bold text-white">Recent Execution Runs</h2>
                </div>
                <Link
                  href="/executions"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading execution data...
                </div>
              ) : !dashboardData?.recentExecutions?.length ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
                  <GitFork className="w-8 h-8 text-slate-700" />
                  <p>No execution runs recorded yet.</p>
                  <Link
                    href="/workflows/builder"
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-medium"
                  >
                    Build your first automation
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentExecutions.map((run) => (
                    <Link
                      key={run.id}
                      href={`/executions/${run.id}`}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            run.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : run.status === 'FAILED'
                              ? 'bg-rose-500'
                              : run.status === 'RUNNING'
                              ? 'bg-blue-500 animate-ping'
                              : 'bg-amber-500'
                          }`}
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition">
                            {run.workflowName}
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            Run ID: {run.id?.substring(0, 8)} • Started{' '}
                            {new Date(run.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              run.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : run.status === 'FAILED'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {run.status}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {run.duration ? `${run.duration}ms` : 'In progress'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Live AI Agent Feed (1 Col) */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white">AI Agent Stream</h2>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
                {liveAgentFeed.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        {item.agent} Agent
                      </span>
                      <span className="text-[10px] text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
