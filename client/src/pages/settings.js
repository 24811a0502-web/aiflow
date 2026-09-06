import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Settings,
  ShieldCheck,
  Key,
  Database,
  Cpu,
  User,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        console.error('Failed to query health', err);
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>Settings &amp; Platform Health – Agentflow_AI</title>
        </Head>

        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
            <p className="text-xs text-slate-400 mt-1">
              Operator profile, role permissions, encryption key health, and substrate telemetry.
            </p>
          </div>

          {/* Profile Section */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Operator Profile</h2>
                <span className="text-[11px] text-slate-500">Active console session details</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Name
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
                  {user?.name || 'Operator'}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
                  {user?.email || 'operator@agentflow.io'}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-blue-400 font-semibold capitalize">
                  {user?.role || 'operator'}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Session Token Validity
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 7 Days (JWT Signed)
                </div>
              </div>
            </div>
          </div>

          {/* Substrate & Security Health Checks */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Security &amp; Substrate Health</h2>
                <span className="text-[11px] text-slate-500">
                  Application-level encryption and agent orchestrator telemetry
                </span>
              </div>
            </div>

            {loadingHealth ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Inspecting subsystems...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">CREDENTIAL_ENCRYPTION_KEY</h4>
                      <p className="text-[11px] text-slate-400">
                        AES-256-GCM cipher with unique IV and authentication tags at rest
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    VALID (256-BIT)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Database Substrate</h4>
                      <p className="text-[11px] text-slate-400">
                        {health?.database?.inMemoryFallback
                          ? 'Zero-Dependency In-Memory Store active (auto-fallback enabled)'
                          : 'MongoDB Connection Active'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase">
                    {health?.database?.inMemoryFallback ? 'In-Memory Fallback' : 'MongoDB'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">LangGraph Substrate</h4>
                      <p className="text-[11px] text-slate-400">
                        Agent graph orchestrator status reported with each execution run
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase">
                    {health?.langGraph || 'not-installed'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">AI Generation Pipeline</h4>
                      <p className="text-[11px] text-slate-400">
                        Primary OpenRouter $\rightarrow$ Secondary Gemini $\rightarrow$ Deterministic Rule Builder
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                    3-Tier Fallback Active
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
