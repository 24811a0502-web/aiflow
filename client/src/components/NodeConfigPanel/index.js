import { X, Trash2, Settings2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const { selectedNode, selectNode, updateSelectedNodeData, deleteSelectedNode } = useWorkflowStore();

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center text-slate-500 h-full">
        <Settings2 className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-xs font-medium text-slate-400">No Node Selected</p>
        <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
          Click any step on the canvas to configure parameters, actions, and credentials.
        </p>
      </div>
    );
  }

  const { type, data = {} } = selectedNode;
  const params = data.params || {};

  const handleParamChange = (key, value) => {
    updateSelectedNodeData({
      params: {
        ...params,
        [key]: value,
      },
    });
  };

  return (
    <div className="w-80 border-l border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
            {type} Node
          </span>
          <h3 className="text-sm font-semibold text-white truncate max-w-[190px]">
            {data.label || 'Step Configuration'}
          </h3>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 flex-1">
        {/* Label */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Step Label</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => updateSelectedNodeData({ label: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Action</label>
          <input
            type="text"
            value={data.action || ''}
            onChange={(e) => updateSelectedNodeData({ action: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Dynamic Type-specific fields */}
        {type === 'trigger' && (
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Trigger Type</label>
            <select
              value={params.triggerType || 'manual'}
              onChange={(e) => handleParamChange('triggerType', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="manual">Manual Execution</option>
              <option value="webhook">Incoming Webhook</option>
              <option value="schedule">Scheduled Cron</option>
            </select>
          </div>
        )}

        {type === 'ai_prompt' && (
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">AI Prompt Instruction</label>
            <textarea
              rows={4}
              value={params.prompt || ''}
              onChange={(e) => handleParamChange('prompt', e.target.value)}
              placeholder="e.g. Extract name, amount, and order ID from incoming payload..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {type === 'gmail' && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Recipient Email</label>
              <input
                type="text"
                value={params.to || ''}
                onChange={(e) => handleParamChange('to', e.target.value)}
                placeholder="ops@company.com"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Subject</label>
              <input
                type="text"
                value={params.subject || ''}
                onChange={(e) => handleParamChange('subject', e.target.value)}
                placeholder="Agentflow Alert"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Body Template</label>
              <textarea
                rows={3}
                value={params.body || ''}
                onChange={(e) => handleParamChange('body', e.target.value)}
                placeholder="Message details..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        {type === 'slack' && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Channel</label>
              <input
                type="text"
                value={params.channel || ''}
                onChange={(e) => handleParamChange('channel', e.target.value)}
                placeholder="#general or #alerts"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Message Content</label>
              <textarea
                rows={3}
                value={params.message || ''}
                onChange={(e) => handleParamChange('message', e.target.value)}
                placeholder="Notification message..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        {type === 'discord' && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Channel / Webhook</label>
              <input
                type="text"
                value={params.channelId || ''}
                onChange={(e) => handleParamChange('channelId', e.target.value)}
                placeholder="discord-bot-feed"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Message</label>
              <textarea
                rows={3}
                value={params.message || ''}
                onChange={(e) => handleParamChange('message', e.target.value)}
                placeholder="Discord bot notification..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        {type === 'google-sheets' && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Spreadsheet ID</label>
              <input
                type="text"
                value={params.spreadsheetId || ''}
                onChange={(e) => handleParamChange('spreadsheetId', e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Sheet Name</label>
              <input
                type="text"
                value={params.sheetName || ''}
                onChange={(e) => handleParamChange('sheetName', e.target.value)}
                placeholder="Sheet1"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}
      </div>

      {/* Delete button */}
      <div className="pt-4 border-t border-slate-800 mt-4">
        <button
          onClick={deleteSelectedNode}
          className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center justify-center gap-2 transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove Step
        </button>
      </div>
    </div>
  );
}
