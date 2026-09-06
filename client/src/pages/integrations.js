import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Boxes,
  Mail,
  MessageSquare,
  MessageCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Key,
  Lock,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';

const providersInfo = [
  {
    id: 'gmail',
    name: 'Gmail API',
    description: 'Send automated transactional alerts and read inbound operational emails.',
    icon: Mail,
    color: 'from-red-500 to-rose-600',
    authType: 'Google OAuth 2.0',
    scopes: ['gmail.send', 'gmail.readonly'],
  },
  {
    id: 'slack',
    name: 'Slack Workspaces',
    description: 'Post rich alerts to #channels, dispatch incident broadcasts, and reply in threads.',
    icon: MessageSquare,
    color: 'from-emerald-500 to-teal-600',
    authType: 'Slack Bot OAuth',
    scopes: ['chat:write', 'channels:read'],
  },
  {
    id: 'discord',
    name: 'Discord Webhooks & Bot',
    description: 'Dispatch real-time notifications to Discord server channels and page on-call engineers.',
    icon: MessageCircle,
    color: 'from-indigo-500 to-blue-600',
    authType: 'Discord Bot Token / Webhook',
    scopes: ['bot', 'messages.read'],
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Append automated row data, audit logs, and pull tabular inputs for pipeline steps.',
    icon: FileSpreadsheet,
    color: 'from-green-500 to-emerald-600',
    authType: 'Google OAuth 2.0',
    scopes: ['spreadsheets'],
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [manualModal, setManualModal] = useState(null);
  const [manualToken, setManualToken] = useState('');

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      if (res.data.success) {
        setIntegrations(res.data.data.integrations || []);
      }
    } catch (err) {
      console.error('Failed to load integrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleStartOAuth = async (providerId) => {
    try {
      setConnectingProvider(providerId);
      const res = await api.get(`/integrations/oauth/${providerId}/start`);
      if (res.data.success) {
        const url = res.data.data.url;
        if (url.startsWith('http')) {
          window.location.href = url;
        } else {
          // If OAuth credentials missing in environment, open fast manual mock modal
          setManualModal(providerId);
        }
      }
    } catch (err) {
      // open manual token modal
      setManualModal(providerId);
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleSaveManual = async () => {
    if (!manualModal) return;
    try {
      const res = await api.post('/integrations', {
        provider: manualModal,
        accessToken: manualToken || `tok_${manualModal}_active_oauth_token`,
        config: { configuredVia: 'operator_ui' },
      });
      if (res.data.success) {
        setManualModal(null);
        setManualToken('');
        fetchIntegrations();
      }
    } catch (err) {
      alert('Error saving credentials: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDisconnect = async (providerId) => {
    if (!confirm(`Disconnect ${providerId}? Active workflows using this provider will escalate with INTEGRATION_NOT_CONNECTED.`)) return;
    try {
      await api.delete(`/integrations/${providerId}`);
      fetchIntegrations();
    } catch (err) {
      alert('Error disconnecting: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>Integrations &amp; OAuth – Agentflow_AI</title>
        </Head>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Third-Party Integrations
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                OAuth connections and credentials encrypted at rest with AES-256-GCM.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256-GCM Hardware Encrypted</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providersInfo.map((prov) => {
              const Icon = prov.icon;
              const status = integrations.find((i) => i.provider === prov.id);
              const isConnected = status?.isConnected;

              return (
                <div
                  key={prov.id}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${prov.color} text-white shadow-lg`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{prov.name}</h3>
                          <span className="text-[10px] text-slate-400">{prov.authType}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isConnected
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Connected
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Disconnected
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {prov.description}
                    </p>

                    <div className="flex items-center gap-1.5 mb-6 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">
                        Scopes:
                      </span>
                      {prov.scopes.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {isConnected ? 'Credentials encrypted at rest' : 'Requires operator consent'}
                    </span>

                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartOAuth(prov.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                        >
                          Reconnect
                        </button>
                        <button
                          onClick={() => handleDisconnect(prov.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartOAuth(prov.id)}
                        disabled={connectingProvider === prov.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
                      >
                        {connectingProvider === prov.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Key className="w-3.5 h-3.5" />
                        )}
                        Connect {prov.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Credentials Modal */}
        {manualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white capitalize">
                  Authorize {manualModal}
                </h3>
                <button
                  onClick={() => setManualModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Provide an access token, bot token, or click Save to enable simulated encrypted OAuth testing for local development.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Access Token / Webhook Secret
                </label>
                <input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste OAuth token or leave blank for mock dev token"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setManualModal(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveManual}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Save &amp; Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
