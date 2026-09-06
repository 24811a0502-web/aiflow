import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Save,
  Play,
  Copy,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GitFork,
  Activity,
  Layers,
} from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodePalette from '../../components/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState('draft');

  const { workflow, nodes, edges, setWorkflow, isDirty } = useWorkflowStore();

  useEffect(() => {
    if (!id) return;

    const fetchWorkflow = async () => {
      try {
        const res = await api.get(`/workflows/${id}`);
        if (res.data.success) {
          const wf = res.data.data.workflow;
          setWorkflow(wf);
          setWorkflowTitle(wf.name);
          setWorkflowStatus(wf.status || 'draft');
        }
      } catch (err) {
        alert('Failed to load workflow: ' + (err.response?.data?.error || err.message));
        router.push('/workflows');
      }
    };

    fetchWorkflow();
  }, [id, setWorkflow, router]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        name: workflowTitle,
        status: workflowStatus,
        nodes,
        edges,
      };
      const res = await api.put(`/workflows/${id}`, payload);
      if (res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    setExecuting(true);

    try {
      // Save before executing if dirty
      if (isDirty) {
        await api.put(`/workflows/${id}`, {
          name: workflowTitle,
          status: workflowStatus,
          nodes,
          edges,
        });
      }

      const res = await api.post(`/workflows/${id}/execute`, { inputs: { testRun: true } });
      if (res.data.success) {
        const execId = res.data.data.execution.id || res.data.data.execution._id;
        router.push(`/executions/${execId}`);
      }
    } catch (err) {
      alert('Execution failed to dispatch: ' + (err.response?.data?.error || err.message));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>{workflowTitle ? `${workflowTitle} – Canvas` : 'Workflow Canvas'} – Agentflow_AI</title>
        </Head>

        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          {/* Editor Header Toolbar */}
          <div className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/workflows')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Back to Catalog"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-slate-800" />

              <input
                type="text"
                value={workflowTitle}
                onChange={(e) => setWorkflowTitle(e.target.value)}
                placeholder="Workflow name..."
                className="text-xs font-bold text-white bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 rounded px-2 py-1 outline-none transition w-64 md:w-80"
              />

              <select
                value={workflowStatus}
                onChange={(e) => setWorkflowStatus(e.target.value)}
                className="text-[11px] font-semibold bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>

              {saveSuccess && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {nodes.length} nodes • {edges.length} edges
              </span>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Graph'}
              </button>

              <button
                onClick={handleExecute}
                disabled={executing}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {executing ? 'Queuing...' : 'Execute'}
              </button>
            </div>
          </div>

          {/* 3-Pane Canvas Layout: Left Palette | Center Canvas | Right Config Panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Node Palette */}
            <NodePalette />

            {/* Center Canvas */}
            <WorkflowCanvas />

            {/* Right Node Config Panel */}
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
