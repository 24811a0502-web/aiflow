import {
  Play,
  Sparkles,
  Mail,
  MessageSquare,
  MessageCircle,
  FileSpreadsheet,
  GitBranch,
  Plus,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export const paletteNodes = [
  {
    type: 'trigger',
    label: 'Trigger Event',
    description: 'Manual, webhook, or cron trigger',
    icon: Play,
    color: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
  {
    type: 'ai_prompt',
    label: 'AI Reasoning',
    description: 'LLM summary, classification, extraction',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-500',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
  },
  {
    type: 'gmail',
    label: 'Gmail Action',
    description: 'Send alerts or query messages',
    icon: Mail,
    color: 'from-red-500 to-rose-500',
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
  },
  {
    type: 'slack',
    label: 'Slack Message',
    description: 'Post updates to channels',
    icon: MessageSquare,
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  {
    type: 'discord',
    label: 'Discord Alert',
    description: 'Broadcast notifications via bot',
    icon: MessageCircle,
    color: 'from-indigo-500 to-blue-500',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/10',
  },
  {
    type: 'google-sheets',
    label: 'Google Sheets',
    description: 'Append rows or read ranges',
    icon: FileSpreadsheet,
    color: 'from-green-500 to-emerald-600',
    border: 'border-green-500/40',
    bg: 'bg-green-500/10',
  },
  {
    type: 'condition',
    label: 'Condition Gate',
    description: 'Filter flow based on evaluation',
    icon: GitBranch,
    color: 'from-cyan-500 to-blue-500',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
  },
];

export default function NodePalette() {
  const { addNode } = useWorkflowStore();

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md p-4 flex flex-col h-full overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Palette</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Drag onto canvas or click to insert</p>
      </div>

      <div className="space-y-2.5">
        {paletteNodes.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              onClick={() => addNode(item.type)}
              className={`p-3 rounded-xl border ${item.border} ${item.bg} hover:border-slate-500/60 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-start gap-3 group select-none`}
            >
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${item.color} text-white shadow-sm`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {item.label}
                  </span>
                  <Plus className="w-3 h-3 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
